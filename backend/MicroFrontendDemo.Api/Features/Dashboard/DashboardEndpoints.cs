using MicroFrontendDemo.Api.Features.Products;
using MicroFrontendDemo.Api.Features.Users;

namespace MicroFrontendDemo.Api.Features.Dashboard;

public sealed record ActivityItem(
    string Id,
    string Kind,
    string Title,
    string Detail,
    DateTimeOffset OccurredAt);

public static class DashboardEndpoints
{
    public static IEndpointRouteBuilder MapDashboardEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/dashboard/activity", (
            IProductRepository products,
            IUserRepository users) =>
        {
            var productActivity = products.GetAll()
                .OrderByDescending(product => product.UpdatedAt)
                .Take(3)
                .Select(product => new ActivityItem(
                    $"product-{product.Id}",
                    "product",
                    "Product updated",
                    $"{product.Name} · {product.Sku}",
                    product.UpdatedAt));

            var userActivity = users.GetAll()
                .Where(user => user.LastActiveAt is not null)
                .OrderByDescending(user => user.LastActiveAt)
                .Take(3)
                .Select(user => new ActivityItem(
                    $"user-{user.Id}",
                    "user",
                    "Team member active",
                    $"{user.Name} · {user.Role}",
                    user.LastActiveAt!.Value));

            return Results.Ok(productActivity
                .Concat(userActivity)
                .OrderByDescending(item => item.OccurredAt)
                .Take(5));
        }).WithTags("Dashboard");

        return endpoints;
    }
}

