namespace MicroFrontendDemo.Api.Features.Products;

public enum ProductStatus
{
    Active,
    Draft,
    OutOfStock
}

public sealed record Product(
    Guid Id,
    string Sku,
    string Name,
    string Category,
    decimal Price,
    int Inventory,
    ProductStatus Status,
    DateTimeOffset UpdatedAt);

public sealed record ProductInput(
    string Sku,
    string Name,
    string Category,
    decimal Price,
    int Inventory,
    ProductStatus Status);

public sealed record SummaryGroup(string Name, int Count);

public sealed record ProductSummary(
    int Total,
    int Active,
    int LowStock,
    decimal InventoryValue,
    IReadOnlyCollection<SummaryGroup> Categories);

public static class ProductValidation
{
    public static Dictionary<string, string[]> Validate(ProductInput input)
    {
        var errors = new Dictionary<string, string[]>();

        AddRequiredOrMaxLength(errors, "sku", input.Sku, 30);
        AddRequiredOrMaxLength(errors, "name", input.Name, 100);
        AddRequiredOrMaxLength(errors, "category", input.Category, 60);

        if (input.Price < 0)
            errors["price"] = ["Price cannot be negative."];

        if (input.Inventory < 0)
            errors["inventory"] = ["Inventory cannot be negative."];

        return errors;
    }

    private static void AddRequiredOrMaxLength(
        IDictionary<string, string[]> errors,
        string key,
        string? value,
        int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
            errors[key] = ["This field is required."];
        else if (value.Trim().Length > maxLength)
            errors[key] = [$"Use {maxLength} characters or fewer."];
    }
}

