import { useCallback, useEffect, useState } from "react";
import type { Product, ProductInput } from "@mfe/shared";
import {
  announceProductsChanged,
  createProduct,
  deleteProduct,
  getProducts,
  type ProductFilters,
  updateProduct
} from "../api/productsApi";

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : "Products could not be loaded.";
}

export function useProducts(filters: ProductFilters) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      setProducts(await getProducts(filters, signal));
    } catch (caught) {
      if (!isAbortError(caught)) setError(messageFrom(caught));
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [filters.category, filters.search, filters.status]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const add = useCallback(async (input: ProductInput) => {
    const created = await createProduct(input);
    announceProductsChanged();
    await load();
    return created;
  }, [load]);

  const update = useCallback(async (id: string, input: ProductInput) => {
    const updated = await updateProduct(id, input);
    announceProductsChanged();
    await load();
    return updated;
  }, [load]);

  const remove = useCallback(async (id: string) => {
    await deleteProduct(id);
    announceProductsChanged();
    await load();
  }, [load]);

  return {
    add,
    error,
    isLoading,
    products,
    refresh: () => load(),
    remove,
    update
  };
}
