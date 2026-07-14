import type { ApiValidationProblem } from "./contracts";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly validationErrors: Record<string, string[]> = {}
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseError(response: Response): Promise<ApiError> {
  let body: ApiValidationProblem | undefined;

  try {
    body = (await response.json()) as ApiValidationProblem;
  } catch {
    // Some infrastructure errors return no JSON body.
  }

  return new ApiError(
    body?.detail ?? body?.title ?? `Request failed with status ${response.status}.`,
    response.status,
    body?.errors
  );
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers
    }
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function toQueryString(values: Record<string, string | undefined>): string {
  const query = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });

  const result = query.toString();
  return result ? `?${result}` : "";
}

