namespace Filamorfosis.Infrastructure.Services;

public interface IS3Service
{
    Task<string> UploadAsync(Stream stream, string key, string contentType);
    Task<string> GetPresignedUrlAsync(string key, int ttlMinutes = 60);
    Task DeleteAsync(string key);
}
