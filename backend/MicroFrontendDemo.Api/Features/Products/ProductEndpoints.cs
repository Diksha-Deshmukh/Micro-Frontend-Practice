namespace MicroFrontendDemo.Api.Features.Products;

public static class ProductEndpoints
{
    public static IEndpointRouteBuilder MapProductEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/products").WithTags("Products");

        group.MapGet("/", (
            string? search,
            string? category,
            ProductStatus? status,
            IProductRepository repository) =>
        {
            IEnumerable<Product> products = repository.GetAll();

            if (!string.IsNullOrWhiteSpace(search))
            {
                products = products.Where(product =>
                    product.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                    product.Sku.Contains(search, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(category))
                products = products.Where(product => product.Category.Equals(category, StringComparison.OrdinalIgnoreCase));

            if (status is not null)
                products = products.Where(product => product.Status == status);

            return Results.Ok(products.OrderByDescending(product => product.UpdatedAt));
        });

        group.MapGet("/summary", (IProductRepository repository) =>
            Results.Ok(repository.GetSummary()));

        group.MapGet("/{id:guid}", (Guid id, IProductRepository repository) =>
            repository.GetById(id) is { } product
                ? Results.Ok(product)
                : Results.NotFound());

        group.MapPost("/", (ProductInput input, IProductRepository repository) =>
        {
            var errors = ProductValidation.Validate(input);
            AddDuplicateSkuError(errors, input.Sku, repository);
            if (errors.Count > 0) return Results.ValidationProblem(errors);

            var product = repository.Add(input);
            return Results.Created($"/api/products/{product.Id}", product);
        });

        group.MapPut("/{id:guid}", (Guid id, ProductInput input, IProductRepository repository) =>
        {
            var errors = ProductValidation.Validate(input);
            AddDuplicateSkuError(errors, input.Sku, repository, id);
            if (errors.Count > 0) return Results.ValidationProblem(errors);

            return repository.Update(id, input) is { } product
                ? Results.Ok(product)
                : Results.NotFound();
        });

        group.MapDelete("/{id:guid}", (Guid id, IProductRepository repository) =>
            repository.Delete(id) ? Results.NoContent() : Results.NotFound());

        return endpoints;
    }

    private static void AddDuplicateSkuError(
        IDictionary<string, string[]> errors,
        string? sku,
        IProductRepository repository,
        Guid? exceptId = null)
    {
        if (!string.IsNullOrWhiteSpace(sku) && repository.IsSkuInUse(sku, exceptId))
            errors["sku"] = ["A product with this SKU already exists."];
    }
}

