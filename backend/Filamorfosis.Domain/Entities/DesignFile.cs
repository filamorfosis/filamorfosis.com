namespace Filamorfosis.Domain.Entities;

public class DesignFile
{
    public Guid Id { get; set; }
    public string S3Key { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public DateTime UploadedAt { get; set; }
    public Guid? UploadedByUserId { get; set; }
}
