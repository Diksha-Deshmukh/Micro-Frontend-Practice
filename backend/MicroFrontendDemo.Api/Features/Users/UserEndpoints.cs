namespace MicroFrontendDemo.Api.Features.Users;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/users").WithTags("Users");

        group.MapGet("/", (
            string? search,
            UserRole? role,
            UserStatus? status,
            IUserRepository repository) =>
        {
            IEnumerable<AppUser> users = repository.GetAll();

            if (!string.IsNullOrWhiteSpace(search))
            {
                users = users.Where(user =>
                    user.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                    user.Email.Contains(search, StringComparison.OrdinalIgnoreCase));
            }

            if (role is not null)
                users = users.Where(user => user.Role == role);

            if (status is not null)
                users = users.Where(user => user.Status == status);

            return Results.Ok(users.OrderBy(user => user.Name));
        });

        group.MapGet("/summary", (IUserRepository repository) =>
            Results.Ok(repository.GetSummary()));

        group.MapGet("/{id:guid}", (Guid id, IUserRepository repository) =>
            repository.GetById(id) is { } user
                ? Results.Ok(user)
                : Results.NotFound());

        group.MapPost("/", (UserInput input, IUserRepository repository) =>
        {
            var errors = UserValidation.Validate(input);
            AddDuplicateEmailError(errors, input.Email, repository);
            if (errors.Count > 0) return Results.ValidationProblem(errors);

            var user = repository.Add(input);
            return Results.Created($"/api/users/{user.Id}", user);
        });

        group.MapPut("/{id:guid}", (Guid id, UserInput input, IUserRepository repository) =>
        {
            var errors = UserValidation.Validate(input);
            AddDuplicateEmailError(errors, input.Email, repository, id);
            if (errors.Count > 0) return Results.ValidationProblem(errors);

            return repository.Update(id, input) is { } user
                ? Results.Ok(user)
                : Results.NotFound();
        });

        group.MapDelete("/{id:guid}", (Guid id, IUserRepository repository) =>
            repository.Delete(id) ? Results.NoContent() : Results.NotFound());

        return endpoints;
    }

    private static void AddDuplicateEmailError(
        IDictionary<string, string[]> errors,
        string? email,
        IUserRepository repository,
        Guid? exceptId = null)
    {
        if (!string.IsNullOrWhiteSpace(email) && repository.IsEmailInUse(email, exceptId))
            errors["email"] = ["A user with this email already exists."];
    }
}

