import { useCallback, useEffect, useState } from "react";
import type { ProductSummary } from "@mfe/shared";
import { getProductSummary, PRODUCTS_CHANGED_EVENT } from "../api/productsApi";

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function useProductSummary() {
  const [summary, setSummary] = useState<ProductSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      setSummary(await getProductSummary(signal));
    } catch (caught) {
      if (!isAbortError(caught)) {
        setError(caught instanceof Error ? caught.message : "Product summary could not be loaded.");
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const handleProductsChanged = () => void load();

    void load(controller.signal);
    window.addEventListener(PRODUCTS_CHANGED_EVENT, handleProductsChanged);

    return () => {
      controller.abort();
      window.removeEventListener(PRODUCTS_CHANGED_EVENT, handleProductsChanged);
    };
  }, [load]);

  return {
    error,
    isLoading,
    refresh: () => load(),
    summary
  };
}
