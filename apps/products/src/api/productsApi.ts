import {
  apiRequest,
  toQueryString,
  type Product,
  type ProductInput,
  type ProductStatus,
  type ProductSummary
} from "@mfe/shared";

export interface ProductFilters {
  search?: string;
  category?: string;
  status?: ProductStatus;
}

export const PRODUCTS_CHANGED_EVENT = "app:products-changed";

export function getProducts(filters: ProductFilters, signal?: AbortSignal): Promise<Product[]> {
  const query = toQueryString({
    search: filters.search,
    category: filters.category,
    status: filters.status
  });

  return apiRequest<Product[]>(`/api/products/${query}`, { signal });
}

export function getProductSummary(signal?: AbortSignal): Promise<ProductSummary> {
  return apiRequest<ProductSummary>("/api/products/summary", { signal });
}

export function createProduct(input: ProductInput): Promise<Product> {
  return apiRequest<Product>("/api/products/", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateProduct(id: string, input: ProductInput): Promise<Product> {
  return apiRequest<Product>(`/api/products/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export function deleteProduct(id: string): Promise<void> {
  return apiRequest<void>(`/api/products/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}

export function announceProductsChanged(): void {
  window.dispatchEvent(new Event(PRODUCTS_CHANGED_EVENT));
}
