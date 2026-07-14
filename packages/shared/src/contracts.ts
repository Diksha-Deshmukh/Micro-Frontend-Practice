export type ProductStatus = "Active" | "Draft" | "OutOfStock";

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  inventory: number;
  status: ProductStatus;
  updatedAt: string;
}

export interface ProductInput {
  sku: string;
  name: string;
  category: string;
  price: number;
  inventory: number;
  status: ProductStatus;
}

export interface ProductSummary {
  total: number;
  active: number;
  lowStock: number;
  inventoryValue: number;
  categories: Array<{ name: string; count: number }>;
}

export type UserRole = "Admin" | "Manager" | "Viewer";
export type UserStatus = "Active" | "Invited" | "Suspended";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastActiveAt: string | null;
}

export interface UserInput {
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export interface UserSummary {
  total: number;
  active: number;
  pendingInvites: number;
  roles: Array<{ name: string; count: number }>;
}

export interface ActivityItem {
  id: string;
  kind: "product" | "user" | "system";
  title: string;
  detail: string;
  occurredAt: string;
}

export interface ApiValidationProblem {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

