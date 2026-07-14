import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  IconButton,
  LoadingBlock,
  Modal,
  PageHeader,
  SearchInput,
  SelectField,
  type Product,
  type ProductInput,
  type ProductStatus
} from "@mfe/shared";
import "@mfe/shared/styles.css";
import { ProductForm } from "./components/ProductForm";
import { formatCurrency, formatDate } from "./format";
import { useDebouncedValue } from "./hooks/useDebouncedValue";
import { useProducts } from "./hooks/useProducts";
import { useProductSummary } from "./hooks/useProductSummary";
import { ProductSummaryView } from "./ProductSummary";
import "./styles.css";

type EditorState =
  | { kind: "create" }
  | { kind: "edit"; product: Product }
  | null;

interface Notice {
  message: string;
  tone: "success" | "error";
}

function statusLabel(status: ProductStatus): string {
  return status === "OutOfStock" ? "Out of stock" : status;
}

function statusTone(status: ProductStatus): "success" | "warning" | "danger" {
  if (status === "Active") return "success";
  if (status === "Draft") return "warning";
  return "danger";
}

function ProductRows({
  onDelete,
  onEdit,
  products
}: {
  onDelete: (product: Product) => void;
  onEdit: (product: Product) => void;
  products: Product[];
}) {
  return (
    <div className="table-wrap">
      <table className="data-table products-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Price</th>
            <th>Inventory</th>
            <th>Status</th>
            <th>Updated</th>
            <th><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const isLowStock = product.inventory > 0 && product.inventory <= 8;

            return (
              <tr key={product.id}>
                <td>
                  <div className="table-primary">
                    <span className="table-primary__icon"><Icon name="box" /></span>
                    <span>
                      <strong>{product.name}</strong>
                      <small>{product.sku}</small>
                    </span>
                  </div>
                </td>
                <td>{product.category}</td>
                <td className="products-table__numeric">{formatCurrency(product.price)}</td>
                <td>
                  <span className={`products-stock${product.inventory === 0 ? " products-stock--empty" : isLowStock ? " products-stock--low" : ""}`}>
                    {product.inventory.toLocaleString()} units
                  </span>
                </td>
                <td><Badge tone={statusTone(product.status)}>{statusLabel(product.status)}</Badge></td>
                <td>
                  <time dateTime={product.updatedAt} title={product.updatedAt}>{formatDate(product.updatedAt)}</time>
                </td>
                <td>
                  <div className="row-actions">
                    <IconButton icon="edit" label={`Edit ${product.name}`} onClick={() => onEdit(product)} />
                    <IconButton icon="trash" label={`Delete ${product.name}`} onClick={() => onDelete(product)} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ProductsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<ProductStatus | "">("");
  const [editor, setEditor] = useState<EditorState>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim(), 250);

  const filters = useMemo(() => ({
    search: debouncedSearch || undefined,
    category: category || undefined,
    status: status || undefined
  }), [category, debouncedSearch, status]);

  const { add, error, isLoading, products, refresh, remove, update } = useProducts(filters);
  const summaryState = useProductSummary();
  const categories = summaryState.summary?.categories.map((entry) => entry.name) ?? [];
  const hasFilters = Boolean(search || category || status);

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setStatus("");
  };

  const saveProduct = async (input: ProductInput) => {
    if (editor?.kind === "edit") {
      const updated = await update(editor.product.id, input);
      setNotice({ message: `${updated.name} was updated.`, tone: "success" });
    } else {
      const created = await add(input);
      setNotice({ message: `${created.name} was added to the catalog.`, tone: "success" });
    }

    setEditor(null);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await remove(productToDelete.id);
      setNotice({ message: `${productToDelete.name} was deleted.`, tone: "success" });
      setProductToDelete(null);
    } catch (caught) {
      setDeleteError(caught instanceof Error ? caught.message : "The product could not be deleted.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="products-page">
      <PageHeader
        actions={(
          <>
            <Button disabled={isLoading} icon="refresh" onClick={() => void refresh()} variant="secondary">Refresh</Button>
            <Button icon="plus" onClick={() => setEditor({ kind: "create" })}>Add product</Button>
          </>
        )}
        eyebrow="Catalog operations"
        subtitle="Manage product availability, pricing, and inventory from an independently deployed micro frontend."
        title="Products"
      />

      {notice ? (
        <div aria-live="polite" className={`notice notice--${notice.tone} products-page__notice`} role="status">
          <Icon name={notice.tone === "success" ? "check" : "close"} />
          <span>{notice.message}</span>
          <IconButton icon="close" label="Dismiss notification" onClick={() => setNotice(null)} />
        </div>
      ) : null}

      <ProductSummaryView
        error={summaryState.error}
        isLoading={summaryState.isLoading}
        onRetry={summaryState.refresh}
        summary={summaryState.summary}
      />

      <Card className="data-card products-data-card">
        <div className="toolbar products-toolbar">
          <SearchInput onChange={setSearch} placeholder="Search products or SKU" value={search} />
          <SelectField label="Category" onChange={(event) => setCategory(event.target.value)} value={category}>
            <option value="">All categories</option>
            {categories.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
          </SelectField>
          <SelectField label="Status" onChange={(event) => setStatus(event.target.value as ProductStatus | "")} value={status}>
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="OutOfStock">Out of stock</option>
          </SelectField>
          <span aria-live="polite" className="products-toolbar__count">
            {isLoading ? "Updating…" : `${products.length} ${products.length === 1 ? "product" : "products"}`}
          </span>
        </div>

        {error && products.length > 0 ? (
          <div className="notice notice--error products-data-card__notice" role="alert">{error}</div>
        ) : null}

        {isLoading && products.length === 0 ? <LoadingBlock label="Loading products" /> : null}

        {!isLoading && error && products.length === 0 ? (
          <ErrorState onRetry={() => void refresh()} title="Products unavailable" />
        ) : null}

        {!isLoading && !error && products.length === 0 ? (
          <EmptyState
            action={hasFilters ? <Button onClick={clearFilters} variant="secondary">Clear filters</Button> : <Button icon="plus" onClick={() => setEditor({ kind: "create" })}>Add product</Button>}
            description={hasFilters ? "Try a different search or clear the current filters." : "Add the first product to start building your catalog."}
            title={hasFilters ? "No matching products" : "Your catalog is empty"}
          />
        ) : null}

        {products.length > 0 ? (
          <ProductRows
            onDelete={(product) => {
              setDeleteError(null);
              setProductToDelete(product);
            }}
            onEdit={(product) => setEditor({ kind: "edit", product })}
            products={products}
          />
        ) : null}
      </Card>

      {editor ? (
        <ProductForm
          key={editor.kind === "edit" ? editor.product.id : "new-product"}
          onCancel={() => setEditor(null)}
          onSubmit={saveProduct}
          product={editor.kind === "edit" ? editor.product : undefined}
        />
      ) : null}

      {productToDelete ? (
        <Modal onClose={() => !isDeleting && setProductToDelete(null)} title="Delete product">
          <div className="modal__body">
            {deleteError ? <div className="notice notice--error" role="alert">{deleteError}</div> : null}
            <div className="products-delete-dialog">
              <span className="products-delete-dialog__icon"><Icon name="trash" /></span>
              <div>
                <h3>Delete {productToDelete.name}?</h3>
                <p>This removes <strong>{productToDelete.sku}</strong> from the catalog. This action cannot be undone.</p>
              </div>
            </div>
          </div>
          <footer className="modal__footer">
            <Button disabled={isDeleting} onClick={() => setProductToDelete(null)} variant="secondary">Cancel</Button>
            <Button disabled={isDeleting} onClick={() => void confirmDelete()} variant="danger">
              {isDeleting ? "Deleting…" : "Delete product"}
            </Button>
          </footer>
        </Modal>
      ) : null}
    </section>
  );
}

export default ProductsPage;
