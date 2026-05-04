using Microsoft.Extensions.Logging;

namespace Filamorfosis.Infrastructure.Services;

/// <summary>
/// Local-disk "S3" service for development.
/// Files are saved under {ContentRoot}/wwwroot/uploads/{key} and served as static files.
/// The returned URL is an absolute URL using the configured base (e.g. http://localhost:5205).
/// Set LOCAL_S3_CONTENT_ROOT to override the root directory (defaults to current directory).
/// Set LOCAL_S3_BASE_URL to override the base URL (defaults to http://localhost:5205).
/// </summary>
public class LocalDiskS3Service(ILogger<LocalDiskS3Service> logger) : IS3Service
{
    private static readonly string BaseUrl =
        Environment.GetEnvironmentVariable("LOCAL_S3_BASE_URL")
        ?? "http://localhost:5205";

    private static readonly string ContentRoot =
        Environment.GetEnvironmentVariable("LOCAL_S3_CONTENT_ROOT")
        ?? Directory.GetCurrentDirectory();

    public async Task<string> UploadAsync(Stream stream, string key, string contentType)
    {
        var filePath = GetFilePath(key);
        Directory.CreateDirectory(Path.GetDirectoryName(filePath)!);

        await using var fs = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None);
        await stream.CopyToAsync(fs);

        var url = $"{BaseUrl.TrimEnd('/')}/uploads/{key.TrimStart('/')}";
        logger.LogInformation("[LocalDisk] Saved upload: {Key} → {Path} (URL: {Url})", key, filePath, url);
        return url;
    }

    public Task<string> GetPresignedUrlAsync(string key, int ttlMinutes = 60)
    {
        var url = $"{BaseUrl.TrimEnd('/')}/uploads/{key.TrimStart('/')}";
        return Task.FromResult(url);
    }

    public Task DeleteAsync(string key)
    {
        var filePath = GetFilePath(key);
        if (File.Exists(filePath))
        {
            File.Delete(filePath);
            logger.LogInformation("[LocalDisk] Deleted: {Path}", filePath);
        }
        return Task.CompletedTask;
    }

    private static string GetFilePath(string key) =>
        Path.Combine(ContentRoot,
                     "wwwroot",
                     "uploads",
                     key.Replace('/', Path.DirectorySeparatorChar));
}
