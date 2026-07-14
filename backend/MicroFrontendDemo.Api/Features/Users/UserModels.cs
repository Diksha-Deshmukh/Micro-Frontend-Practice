using System.Net.Mail;

namespace MicroFrontendDemo.Api.Features.Users;

public enum UserRole
{
    Admin,
    Manager,
    Viewer
}

public enum UserStatus
{
    Active,
    Invited,
    Suspended
}

public sealed record AppUser(
    Guid Id,
    string Name,
    string Email,
    UserRole Role,
    UserStatus Status,
    DateTimeOffset? LastActiveAt);

public sealed record UserInput(
    string Name,
    string Email,
    UserRole Role,
    UserStatus Status);

public sealed record RoleSummary(string Name, int Count);

public sealed record UserSummary(
    int Total,
    int Active,
    int PendingInvites,
    IReadOnlyCollection<RoleSummary> Roles);

public static class UserValidation
{
    public static Dictionary<string, string[]> Validate(UserInput input)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(input.Name))
            errors["name"] = ["This field is required."];
        else if (input.Name.Trim().Length > 100)
            errors["name"] = ["Use 100 characters or fewer."];

        if (string.IsNullOrWhiteSpace(input.Email))
        {
            errors["email"] = ["This field is required."];
        }
        else
        {
            try
            {
                _ = new MailAddress(input.Email);
            }
            catch (FormatException)
            {
                errors["email"] = ["Enter a valid email address."];
            }
        }

        return errors;
    }
}

