namespace MicroFrontendDemo.Api.Features.Users;

public interface IUserRepository
{
    IReadOnlyCollection<AppUser> GetAll();
    AppUser? GetById(Guid id);
    bool IsEmailInUse(string email, Guid? exceptId = null);
    AppUser Add(UserInput input);
    AppUser? Update(Guid id, UserInput input);
    bool Delete(Guid id);
    UserSummary GetSummary();
}

public sealed class InMemoryUserRepository : IUserRepository
{
    private readonly Lock _gate = new();
    private readonly List<AppUser> _users = Seed();

    public IReadOnlyCollection<AppUser> GetAll()
    {
        lock (_gate)
            return _users.ToArray();
    }

    public AppUser? GetById(Guid id)
    {
        lock (_gate)
            return _users.FirstOrDefault(user => user.Id == id);
    }

    public bool IsEmailInUse(string email, Guid? exceptId = null)
    {
        lock (_gate)
            return _users.Any(user =>
                user.Id != exceptId &&
                user.Email.Equals(email.Trim(), StringComparison.OrdinalIgnoreCase));
    }

    public AppUser Add(UserInput input)
    {
        var user = ToUser(Guid.NewGuid(), input, null);

        lock (_gate)
            _users.Add(user);

        return user;
    }

    public AppUser? Update(Guid id, UserInput input)
    {
        lock (_gate)
        {
            var index = _users.FindIndex(user => user.Id == id);
            if (index < 0) return null;

            var current = _users[index];
            var user = ToUser(id, input, current.LastActiveAt);
            _users[index] = user;
            return user;
        }
    }

    public bool Delete(Guid id)
    {
        lock (_gate)
            return _users.RemoveAll(user => user.Id == id) > 0;
    }

    public UserSummary GetSummary()
    {
        lock (_gate)
        {
            var roles = _users
                .GroupBy(user => user.Role)
                .OrderByDescending(group => group.Count())
                .Select(group => new RoleSummary(group.Key.ToString(), group.Count()))
                .ToArray();

            return new UserSummary(
                _users.Count,
                _users.Count(user => user.Status == UserStatus.Active),
                _users.Count(user => user.Status == UserStatus.Invited),
                roles);
        }
    }

    private static AppUser ToUser(Guid id, UserInput input, DateTimeOffset? lastActiveAt) =>
        new(
            id,
            input.Name.Trim(),
            input.Email.Trim().ToLowerInvariant(),
            input.Role,
            input.Status,
            input.Status == UserStatus.Active ? lastActiveAt ?? DateTimeOffset.UtcNow : null);

    private static List<AppUser> Seed()
    {
        var now = DateTimeOffset.UtcNow;

        return
        [
            new(Guid.Parse("7a6115d1-f54c-4182-e82f-c81985a0f607"), "Diksha Deshmukh", "diksha@example.com", UserRole.Admin, UserStatus.Active, now.AddMinutes(-18)),
            new(Guid.Parse("8b7226e2-065d-4293-f930-d92a96b1a708"), "Maya Chen", "maya@example.com", UserRole.Admin, UserStatus.Active, now.AddMinutes(-5)),
            new(Guid.Parse("9c8337f3-176e-43a4-0a41-ea3ba7c2b809"), "Jon Bell", "jon@example.com", UserRole.Manager, UserStatus.Active, now.AddHours(-1)),
            new(Guid.Parse("ad944804-287f-44b5-1b52-fb4cb8d3c90a"), "Amara Okafor", "amara@example.com", UserRole.Manager, UserStatus.Active, now.AddHours(-4)),
            new(Guid.Parse("bea55915-3980-45c6-2c63-0c5dc9e4da0b"), "Theo Martin", "theo@example.com", UserRole.Viewer, UserStatus.Invited, null),
            new(Guid.Parse("cfb66a26-4a91-46d7-3d74-1d6edaf5eb0c"), "Sofia Rossi", "sofia@example.com", UserRole.Viewer, UserStatus.Active, now.AddDays(-1))
        ];
    }
}

