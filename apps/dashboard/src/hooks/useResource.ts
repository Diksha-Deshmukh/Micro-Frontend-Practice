import { useCallback, useEffect, useState } from "react";

interface ResourceState<T> {
  data?: T;
  error?: Error;
  status: "loading" | "success" | "error";
  updatedAt?: Date;
}

function toError(error: unknown) {
  return error instanceof Error ? error : new Error("An unexpected error occurred.");
}

export function useResource<T>(loader: () => Promise<T>) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<ResourceState<T>>({
    status: "loading"
  });

  useEffect(() => {
    let isCurrent = true;

    setState((current) => ({
      ...current,
      error: undefined,
      status: "loading"
    }));

    loader()
      .then((data) => {
        if (!isCurrent) return;
        setState({
          data,
          status: "success",
          updatedAt: new Date()
        });
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setState((current) => ({
          ...current,
          error: toError(error),
          status: "error"
        }));
      });

    return () => {
      isCurrent = false;
    };
  }, [attempt, loader]);

  const retry = useCallback(() => {
    setAttempt((current) => current + 1);
  }, []);

  return { ...state, retry };
}
