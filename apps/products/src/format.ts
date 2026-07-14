const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short"
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}
