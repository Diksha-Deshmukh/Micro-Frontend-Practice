namespace MicroFrontendDemo.Api.Infrastructure;

public static class StaticFileExtensions
{
    public static IApplicationBuilder UseStaticFilesWithCachePolicy(this IApplicationBuilder app)
    {
        return app.UseStaticFiles(new StaticFileOptions
        {
            OnPrepareResponse = context =>
            {
                var fileName = context.File.Name;

                context.Context.Response.Headers.CacheControl =
                    fileName.Equals("index.html", StringComparison.OrdinalIgnoreCase) ||
                    fileName.Equals("remoteEntry.js", StringComparison.OrdinalIgnoreCase)
                        ? "no-cache, no-store, must-revalidate"
                        : "public, max-age=31536000, immutable";
            }
        });
    }
}

