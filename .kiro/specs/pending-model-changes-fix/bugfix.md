# Bugfix Requirements Document

## Introduction

The API fails to start with an `InvalidOperationException` because EF Core 10 detects that the
`FilamorfosisDbContext` model has pending changes that have not been applied to the local SQLite
database (`filamorfosis.db`). This was introduced after the `AddCostManagement` migration was
created as part of the cost-management-and-pricing feature, but the existing SQLite file on disk
was never updated with `dotnet ef database update`. EF Core 10 promotes the previously-advisory
`PendingModelChangesWarning` to a hard exception, so the application crashes on startup instead
of silently running against a stale schema.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the API starts in Development mode with `SQLITE_DB_PATH` unset and `appsettings.Development.json` pointing to `filamorfosis.db` THEN the system throws `System.InvalidOperationException: An error was generated for warning 'Microsoft.EntityFrameworkCore.Migrations.PendingModelChangesWarning'` and the process exits before serving any requests.

1.2 WHEN the `filamorfosis.db` SQLite file on disk does not contain the `AddCostManagement` migration (i.e., the `Materials`, `CostParameters`, and `GlobalParameters` tables are absent and `ProductVariants` lacks the new cost columns) THEN the system treats the model as out-of-sync and raises the pending-changes exception.

### Expected Behavior (Correct)

2.1 WHEN the API starts in Development mode THEN the system SHALL start successfully without throwing `PendingModelChangesWarning`, because the SQLite database schema matches the current EF Core model.

2.2 WHEN the `AddCostManagement` migration has been applied to `filamorfosis.db` THEN the system SHALL serve API requests normally, with `Materials`, `CostParameters`, and `GlobalParameters` tables present and `ProductVariants` containing the cost columns (`MaterialId`, `BaseCost`, `Profit`, `ManufactureTimeMinutes`, `FilamentGrams`, `PrintType`).

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the API starts with `ConnectionStrings:DefaultConnection` set to `InMemory` (production default / CI) THEN the system SHALL CONTINUE TO use the in-memory database and start without errors.

3.2 WHEN the API starts in the `Testing` environment via `WebApplicationFactory` THEN the system SHALL CONTINUE TO use the in-memory database and all existing integration tests SHALL CONTINUE TO pass.

3.3 WHEN a valid `SQLITE_DB_PATH` environment variable is set THEN the system SHALL CONTINUE TO use that path as the SQLite database location.

3.4 WHEN the API starts after the migration is applied THEN the system SHALL CONTINUE TO seed the default `CostParameter` rows and the `tax_rate` `GlobalParameter` via `DbSeeder` on first run.
