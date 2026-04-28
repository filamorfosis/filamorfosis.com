-- Mark the AddUseCasesToProducts migration as applied without running it
-- This is needed because the use_cases column was already added via PRODUCT-USE-CASE-TAGGING.sql

-- For SQLite:
INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion)
VALUES ('20260428060256_AddUseCasesToProducts', '8.0.0')
ON CONFLICT DO NOTHING;

-- Verify the migration is marked as applied:
SELECT * FROM __EFMigrationsHistory WHERE MigrationId = '20260428060256_AddUseCasesToProducts';
