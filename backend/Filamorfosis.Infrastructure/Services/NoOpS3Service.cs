using Microsoft.Extensions.Logging;

namespace Filamorfosis.Infrastructure.Services;

/// <summary>
/// No-op S3 service for local dev and tests.
/// </summary>
public class NoOpS3Service(ILogger<NoOpS3Service> logger) : IS3Service
{
    public Task<string> UploadAsync(Stream stream, string key, string contentType)
    {
        logger.LogInformation("[NoOp] S3 upload: {Key} ({ContentType})", key, contentType);
        return Task.FromResult(key);
    }

    public Task<string> GetPresignedUrlAsync(string key, int ttlMinutes = 60)
    {
        logger.LogInformation("[NoOp] S3 presigned URL for: {Key}", key);
        return Task.FromResult($"https://s3.example.com/{key}?ttl={ttlMinutes}");
    }

    public Task DeleteAsync(string key)
    {
        logger.LogInformation("[NoOp] S3 delete: {Key}", key);
        return Task.CompletedTask;
    }
}
