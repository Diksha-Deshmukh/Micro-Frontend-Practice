import {
  apiRequest,
  toQueryString,
  type AppUser,
  type UserInput,
  type UserRole,
  type UserStatus,
  type UserSummary
} from "@mfe/shared";

export interface UserFilters {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

const usersPath = "/api/users";
const usersCollectionPath = `${usersPath}/`;

export function getUsers(filters: UserFilters, signal?: AbortSignal): Promise<AppUser[]> {
  const query = toQueryString({
    search: filters.search?.trim(),
    role: filters.role,
    status: filters.status
  });

  return apiRequest<AppUser[]>(`${usersCollectionPath}${query}`, { signal });
}

export function getUserSummary(signal?: AbortSignal): Promise<UserSummary> {
  return apiRequest<UserSummary>(`${usersPath}/summary`, { signal });
}

export function createUser(input: UserInput): Promise<AppUser> {
  return apiRequest<AppUser>(usersCollectionPath, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateUser(id: string, input: UserInput): Promise<AppUser> {
  return apiRequest<AppUser>(`${usersPath}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export function deleteUser(id: string): Promise<void> {
  return apiRequest<void>(`${usersPath}/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}
