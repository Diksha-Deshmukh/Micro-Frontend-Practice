import type { AppUser } from "@mfe/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { getUsers, type UserFilters } from "../api/usersApi";

export function useUsers(filters: UserFilters) {
  const [users, setUsers] = useState<AppUser[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const requestVersion = useRef(0);

  const load = useCallback(async () => {
    const currentVersion = ++requestVersion.current;
    setIsRefreshing(true);
    setError(null);

    try {
      const result = await getUsers({
        search: filters.search,
        role: filters.role,
        status: filters.status
      });

      if (currentVersion === requestVersion.current) {
        setUsers(result);
      }
    } catch (caughtError) {
      if (currentVersion === requestVersion.current) {
        setError(caughtError instanceof Error ? caughtError : new Error("Unable to load users."));
      }
    } finally {
      if (currentVersion === requestVersion.current) {
        setIsRefreshing(false);
      }
    }
  }, [filters.role, filters.search, filters.status]);

  useEffect(() => {
    void load();
    return () => {
      requestVersion.current += 1;
    };
  }, [load]);

  return {
    error,
    isInitialLoading: users === null && isRefreshing,
    isRefreshing,
    refresh: load,
    users: users ?? []
  };
}
