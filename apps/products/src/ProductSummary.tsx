import {
  Card,
  ErrorState,
  LoadingBlock,
  type ProductSummary as ProductSummaryContract
} from "@mfe/shared";
import "@mfe/shared/styles.css";
import { formatCurrency } from "./format";
import { useProductSummary } from "./hooks/useProductSummary";
import "./styles.css";

export interface ProductSummaryProps {
  compact?: boolean;
  className?: string;
}

interface ProductSummaryViewProps extends ProductSummaryProps {
  error: string | null;
  isLoading: boolean;
  onRetry: () => void;
  summary: ProductSummaryContract | null;
}

export function ProductSummaryView({
  className = "",
  compact = false,
  error,
  isLoading,
  onRetry,
  summary
}: ProductSummaryViewProps) {
  const rootClassName = `products-summary${compact ? " products-summary--compact" : ""}${className ? ` ${className}` : ""}`;

  if (isLoading && !summary) {
    return <Card className={`${rootClassName} products-summary--state`}><LoadingBlock label="Loading product summary" /></Card>;
  }

  if (error && !summary) {
    return <Card className={`${rootClassName} products-summary--state`}><ErrorState onRetry={onRetry} title="Product summary unavailable" /></Card>;
  }

  if (!summary) return null;

  const activeRate = summary.total === 0 ? 0 : Math.round((summary.active / summary.total) * 100);

  return (
    <section aria-label="Product summary" className={rootClassName}>
      <Card className="products-summary__metric">
        <span>Total products</span>
        <strong>{summary.total.toLocaleString()}</strong>
        <small>Across {summary.categories.length} categories</small>
      </Card>
      <Card className="products-summary__metric products-summary__metric--success">
        <span>Active catalog</span>
        <strong>{summary.active.toLocaleString()}</strong>
        <small>{activeRate}% of the catalog is live</small>
      </Card>
      <Card className="products-summary__metric products-summary__metric--warning">
        <span>Low stock</span>
        <strong>{summary.lowStock.toLocaleString()}</strong>
        <small>Products with 8 units or fewer</small>
      </Card>
      <Card className="products-summary__metric products-summary__metric--info">
        <span>Inventory value</span>
        <strong>{formatCurrency(summary.inventoryValue)}</strong>
        <small>Current price × inventory</small>
      </Card>
      {!compact ? (
        <Card className="products-summary__categories">
          <span>Catalog mix</span>
          <div>
            {summary.categories.map((category) => (
              <span className="products-summary__category" key={category.name}>
                {category.name}<strong>{category.count}</strong>
              </span>
            ))}
          </div>
        </Card>
      ) : null}
    </section>
  );
}

export function ProductSummary(props: ProductSummaryProps) {
  const { error, isLoading, refresh, summary } = useProductSummary();

  return (
    <ProductSummaryView
      {...props}
      error={error}
      isLoading={isLoading}
      onRetry={refresh}
      summary={summary}
    />
  );
}

export default ProductSummary;
