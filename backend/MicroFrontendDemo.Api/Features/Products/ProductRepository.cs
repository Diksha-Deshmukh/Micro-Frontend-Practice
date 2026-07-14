namespace MicroFrontendDemo.Api.Features.Products;

public interface IProductRepository
{
    IReadOnlyCollection<Product> GetAll();
    Product? GetById(Guid id);
    bool IsSkuInUse(string sku, Guid? exceptId = null);
    Product Add(ProductInput input);
    Product? Update(Guid id, ProductInput input);
    bool Delete(Guid id);
    ProductSummary GetSummary();
}

public sealed class InMemoryProductRepository : IProductRepository
{
    private readonly Lock _gate = new();
    private readonly List<Product> _products = Seed();

    public IReadOnlyCollection<Product> GetAll()
    {
        lock (_gate)
            return _products.ToArray();
    }

    public Product? GetById(Guid id)
    {
        lock (_gate)
            return _products.FirstOrDefault(product => product.Id == id);
    }

    public bool IsSkuInUse(string sku, Guid? exceptId = null)
    {
        lock (_gate)
            return _products.Any(product =>
                product.Id != exceptId &&
                product.Sku.Equals(sku.Trim(), StringComparison.OrdinalIgnoreCase));
    }

    public Product Add(ProductInput input)
    {
        var product = ToProduct(Guid.NewGuid(), input);

        lock (_gate)
            _products.Add(product);

        return product;
    }

    public Product? Update(Guid id, ProductInput input)
    {
        lock (_gate)
        {
            var index = _products.FindIndex(product => product.Id == id);
            if (index < 0) return null;

            var product = ToProduct(id, input);
            _products[index] = product;
            return product;
        }
    }

    public bool Delete(Guid id)
    {
        lock (_gate)
            return _products.RemoveAll(product => product.Id == id) > 0;
    }

    public ProductSummary GetSummary()
    {
        lock (_gate)
        {
            var categories = _products
                .GroupBy(product => product.Category)
                .OrderByDescending(group => group.Count())
                .Select(group => new SummaryGroup(group.Key, group.Count()))
                .ToArray();

            return new ProductSummary(
                _products.Count,
                _products.Count(product => product.Status == ProductStatus.Active),
                _products.Count(product => product.Inventory is > 0 and <= 8),
                _products.Sum(product => product.Price * product.Inventory),
                categories);
        }
    }

    private static Product ToProduct(Guid id, ProductInput input) =>
        new(
            id,
            input.Sku.Trim().ToUpperInvariant(),
            input.Name.Trim(),
            input.Category.Trim(),
            input.Price,
            input.Inventory,
            input.Inventory == 0 ? ProductStatus.OutOfStock : input.Status,
            DateTimeOffset.UtcNow);

    private static List<Product> Seed()
    {
        var now = DateTimeOffset.UtcNow;

        return
        [
            new(Guid.Parse("1c0aaf7b-fef6-4b3c-82c9-62b32f4a9f01"), "PRD-1001", "Mechanical Keyboard", "Accessories", 129.00m, 24, ProductStatus.Active, now.AddMinutes(-35)),
            new(Guid.Parse("2d1bb08c-a0f7-4c4d-93da-73c4305ba102"), "PRD-1002", "Wireless Mouse", "Accessories", 79.50m, 7, ProductStatus.Active, now.AddHours(-2)),
            new(Guid.Parse("3e2cc19d-b108-4d5e-a4eb-84d5416cb203"), "PRD-2001", "4K Display", "Displays", 649.00m, 12, ProductStatus.Active, now.AddHours(-5)),
            new(Guid.Parse("4f3dd2ae-c219-4e6f-b5fc-95e6527dc304"), "PRD-3001", "USB-C Dock", "Workspace", 189.00m, 4, ProductStatus.Active, now.AddDays(-1)),
            new(Guid.Parse("504ee3bf-d32a-4f70-c60d-a6f7638ed405"), "PRD-4001", "Desk Lamp", "Workspace", 94.00m, 0, ProductStatus.OutOfStock, now.AddDays(-2)),
            new(Guid.Parse("615ff4c0-e43b-4071-d71e-b708749fe506"), "PRD-5001", "Laptop Sleeve", "Bags", 48.00m, 18, ProductStatus.Draft, now.AddDays(-3))
        ];
    }
}

