import { useState, type FormEvent } from "react";
import {
  ApiError,
  Button,
  Field,
  Modal,
  SelectField,
  type Product,
  type ProductInput,
  type ProductStatus
} from "@mfe/shared";

interface ProductFormProps {
  product?: Product;
  onCancel: () => void;
  onSubmit: (input: ProductInput) => Promise<void>;
}

interface FormValues {
  sku: string;
  name: string;
  category: string;
  price: string;
  inventory: string;
  status: ProductStatus;
}

type ProductField = keyof ProductInput;
type FormErrors = Partial<Record<ProductField | "form", string>>;

const statuses: ProductStatus[] = ["Active", "Draft", "OutOfStock"];

function initialValues(product?: Product): FormValues {
  return product
    ? {
        sku: product.sku,
        name: product.name,
        category: product.category,
        price: String(product.price),
        inventory: String(product.inventory),
        status: product.status
      }
    : {
        sku: "",
        name: "",
        category: "",
        price: "",
        inventory: "0",
        status: "Draft"
      };
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  const price = Number(values.price);
  const inventory = Number(values.inventory);

  if (!values.sku.trim()) errors.sku = "SKU is required.";
  else if (values.sku.trim().length > 30) errors.sku = "Use 30 characters or fewer.";

  if (!values.name.trim()) errors.name = "Name is required.";
  else if (values.name.trim().length > 100) errors.name = "Use 100 characters or fewer.";

  if (!values.category.trim()) errors.category = "Category is required.";
  else if (values.category.trim().length > 60) errors.category = "Use 60 characters or fewer.";

  if (!values.price.trim()) errors.price = "Price is required.";
  else if (!Number.isFinite(price) || price < 0) errors.price = "Enter a price of zero or more.";

  if (!values.inventory.trim()) errors.inventory = "Inventory is required.";
  else if (!Number.isInteger(inventory) || inventory < 0) errors.inventory = "Enter a whole number of zero or more.";

  return errors;
}

function errorsFrom(error: unknown): FormErrors {
  if (error instanceof ApiError) {
    const fieldErrors = Object.fromEntries(
      Object.entries(error.validationErrors).map(([field, messages]) => [field, messages[0]])
    ) as FormErrors;

    return Object.keys(fieldErrors).length > 0 ? fieldErrors : { form: error.message };
  }

  return { form: error instanceof Error ? error.message : "The product could not be saved." };
}

export function ProductForm({ product, onCancel, onSubmit }: ProductFormProps) {
  const [values, setValues] = useState<FormValues>(() => initialValues(product));
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = <Key extends keyof FormValues>(key: Key, value: FormValues[Key]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validate(values);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await onSubmit({
        sku: values.sku.trim(),
        name: values.name.trim(),
        category: values.category.trim(),
        price: Number(values.price),
        inventory: Number(values.inventory),
        status: values.status
      });
    } catch (error) {
      setErrors(errorsFrom(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal onClose={onCancel} title={product ? "Edit product" : "Add product"}>
      <form noValidate onSubmit={handleSubmit}>
        <div className="modal__body">
          {errors.form ? <div className="notice notice--error" role="alert">{errors.form}</div> : null}
          <div className="form-grid">
            <Field
              autoComplete="off"
              autoFocus
              error={errors.sku}
              label="SKU"
              maxLength={30}
              name="sku"
              onChange={(event) => setValue("sku", event.target.value.toUpperCase())}
              placeholder="ORB-6001"
              value={values.sku}
            />
            <SelectField
              error={errors.status}
              label="Status"
              name="status"
              onChange={(event) => setValue("status", event.target.value as ProductStatus)}
              value={values.status}
            >
              {statuses.map((status) => <option key={status} value={status}>{status === "OutOfStock" ? "Out of stock" : status}</option>)}
            </SelectField>
            <div className="form-grid__wide">
              <Field
                error={errors.name}
                label="Product name"
                maxLength={100}
                name="name"
                onChange={(event) => setValue("name", event.target.value)}
                placeholder="Enter product name"
                value={values.name}
              />
            </div>
            <div className="form-grid__wide">
              <Field
                error={errors.category}
                label="Category"
                list="product-category-suggestions"
                maxLength={60}
                name="category"
                onChange={(event) => setValue("category", event.target.value)}
                placeholder="Accessories"
                value={values.category}
              />
            </div>
            <datalist id="product-category-suggestions">
              <option value="Accessories" />
              <option value="Bags" />
              <option value="Displays" />
              <option value="Workspace" />
            </datalist>
            <Field
              error={errors.price}
              inputMode="decimal"
              label="Price (USD)"
              min="0"
              name="price"
              onChange={(event) => setValue("price", event.target.value)}
              placeholder="0.00"
              step="0.01"
              type="number"
              value={values.price}
            />
            <Field
              error={errors.inventory}
              inputMode="numeric"
              label="Inventory"
              min="0"
              name="inventory"
              onChange={(event) => setValue("inventory", event.target.value)}
              step="1"
              type="number"
              value={values.inventory}
            />
          </div>
          <p className="products-form__hint">Products with zero inventory are saved as out of stock.</p>
        </div>
        <footer className="modal__footer">
          <Button disabled={isSubmitting} onClick={onCancel} type="button" variant="secondary">Cancel</Button>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Saving…" : product ? "Save changes" : "Add product"}
          </Button>
        </footer>
      </form>
    </Modal>
  );
}
