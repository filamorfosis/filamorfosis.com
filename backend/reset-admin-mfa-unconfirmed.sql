-- Reset admin MFA secret to UNCONFIRMED state
-- This will force the frontend to show the QR code setup flow

-- Delete existing MFA secrets for admin user
DELETE FROM AdminMfaSecrets 
WHERE UserId IN (SELECT Id FROM AspNetUsers WHERE Email = 'admin@filamorfosis.com');

-- Insert an UNCONFIRMED MFA secret
-- This will trigger the QR code setup flow in the frontend
INSERT INTO AdminMfaSecrets (Id, UserId, SecretBase32, IsConfirmed, CreatedAt)
SELECT 
    lower(hex(randomblob(16))),
    Id,
    'JBSWY3DPEHPK3PXP',
    0,  -- IsConfirmed = false
    datetime('now')
FROM AspNetUsers 
WHERE Email = 'admin@filamorfosis.com';
