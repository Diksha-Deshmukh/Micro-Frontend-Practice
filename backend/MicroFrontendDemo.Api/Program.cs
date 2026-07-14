using System.Text.Json.Serialization;
using MicroFrontendDemo.Api.Features.Dashboard;
using MicroFrontendDemo.Api.Features.Products;
using MicroFrontendDemo.Api.Features.Users;
using MicroFrontendDemo.Api.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .GetChildren()
    .Select(origin => origin.Value)
    .OfType<string>()
    .ToArray();

builder.Services.AddCors(options =>
    options.AddPolicy("MicroFrontends", policy =>
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()));

builder.Services.AddSingleton<IProductRepository, InMemoryProductRepository>();
builder.Services.AddSingleton<IUserRepository, InMemoryUserRepository>();

var app = builder.Build();

app.UseExceptionHandler();
app.UseCors("MicroFrontends");
app.UseDefaultFiles();
app.UseStaticFilesWithCachePolicy();

app.MapGet("/health", () => Results.Ok(new
{
    status = "Healthy",
    service = "MicroFrontendDemo.Api",
    checkedAt = DateTimeOffset.UtcNow
}));

app.MapProductEndpoints();
app.MapUserEndpoints();
app.MapDashboardEndpoints();
app.MapMethods(
    "/api/{**path}",
    ["GET", "POST", "PUT", "PATCH", "DELETE"],
    () => Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "API endpoint not found."));
app.MapFallbackToFile("index.html");

app.Run();

public partial class Program;
