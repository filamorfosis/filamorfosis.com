-- Reset admin MFA secret to the seeded value
-- This will allow you to login with the default TOTP secret: JBSWY3DPEHPK3PXP

-- Find the admin user ID
-- DELETE FROM AdminMfaSecrets WHERE UserId IN (SELECT Id FROM AspNetUsers WHERE Email = 'admin@filamorfosis.com');

-- The seeder will recreate it on next run
-- Or you can manually insert it:
-- INSERT INTO AdminMfaSecrets (Id, UserId, SecretBase32, IsConfirmed, CreatedAt, LastUsedTotpCode)
-- SELECT LOWER(HEX(RANDOMBLOB(16))), Id, 'JBSWY3DPEHPK3PXP', 1, datetime('now'), NULL
-- FROM AspNetUsers WHERE Email = 'admin@filamorfosis.com';

-- For SQLite, use this simpler approach:
DELETE FROM AdminMfaSecrets WHERE UserId IN (SELECT Id FROM AspNetUsers WHERE Email = 'admin@filamorfosis.com');
