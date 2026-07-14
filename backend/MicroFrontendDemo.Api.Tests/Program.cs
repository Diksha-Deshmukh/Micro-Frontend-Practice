using MicroFrontendDemo.Api.Features.Products;
using MicroFrontendDemo.Api.Features.Users;

var checks = new List<(string Name, Action Run)>
{
    ("product repository starts with seeded data", () =>
    {
        var repository = new InMemoryProductRepository();
        Expect(repository.GetAll().Count >= 6, "Expected at least six seeded products.");
        Expect(repository.GetSummary().LowStock >= 1, "Expected the low-stock summary to be populated.");
    }),
    ("product input validation rejects invalid values", () =>
    {
        var errors = ProductValidation.Validate(new ProductInput("", "", "", -1, -1, ProductStatus.Active));
        Expect(errors.Keys.Count >= 5, "Expected all invalid product fields to be reported.");
    }),
    ("product repository supports a create-update-delete lifecycle", () =>
    {
        var repository = new InMemoryProductRepository();
        var created = repository.Add(new ProductInput("TST-1", "Test product", "Test", 10, 3, ProductStatus.Active));
        var updated = repository.Update(created.Id, new ProductInput("TST-1", "Updated product", "Test", 12, 2, ProductStatus.Active));

        Expect(updated?.Name == "Updated product", "Expected the product update to be persisted.");
        Expect(repository.Delete(created.Id), "Expected the product to be deleted.");
    }),
    ("user validation and summaries are populated", () =>
    {
        var repository = new InMemoryUserRepository();
        var errors = UserValidation.Validate(new UserInput("", "not-an-email", UserRole.Viewer, UserStatus.Invited));

        Expect(errors.ContainsKey("name") && errors.ContainsKey("email"), "Expected invalid user fields to be reported.");
        Expect(repository.GetSummary().PendingInvites >= 1, "Expected a pending invite in the seed data.");
    })
};

var failures = 0;

foreach (var check in checks)
{
    try
    {
        check.Run();
        Console.WriteLine($"PASS  {check.Name}");
    }
    catch (Exception exception)
    {
        failures++;
        Console.Error.WriteLine($"FAIL  {check.Name}: {exception.Message}");
    }
}

Console.WriteLine($"{checks.Count - failures}/{checks.Count} backend checks passed.");
return failures == 0 ? 0 : 1;

static void Expect(bool condition, string message)
{
    if (!condition) throw new InvalidOperationException(message);
}

