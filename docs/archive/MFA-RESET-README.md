# Admin MFA Reset - Development Guide

## Automatic MFA Reset on API Restart

The seeder now automatically resets the admin MFA secret to an unconfirmed state on every API restart. This means you can reseed the admin MFA without running any PowerShell scripts.

## How It Works

When the API starts, the `DbSeeder` checks the admin user's MFA secret:

1. **If no MFA secret exists**: Creates a new unconfirmed secret with value `JBSWY3DPEHPK3PXP`
2. **If MFA secret is confirmed**: Resets it to unconfirmed with value `JBSWY3DPEHPK3PXP`
3. **If MFA secret has wrong value**: Updates it to `JBSWY3DPEHPK3PXP` and marks as unconfirmed

## To Reset Admin MFA

Simply restart the API server:

```bash
# Stop the API (Ctrl+C)
# Then restart:
cd backend/Filamorfosis.API
dotnet run
```

The seeder will automatically reset the MFA secret to unconfirmed state.

## Login After Reset

1. **Navigate to admin.html**
2. **Login with credentials:**
   - Email: `admin@filamorfosis.com`
   - Password: `Admin1234!`
3. **The QR code setup modal will appear automatically**
4. **Scan the QR code** with your authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)
5. **Or manually enter the secret:** `JBSWY3DPEHPK3PXP`
6. **Enter the 6-digit TOTP code** from your authenticator app
7. **You're logged in!**

## Why This Works

- The seeder sets `IsConfirmed = false` for the MFA secret
- The frontend (`admin-auth.js`) checks `mfaEnabled` from the login response
- When `mfaEnabled = false`, the frontend automatically triggers the QR code setup flow
- After you confirm the TOTP code, `IsConfirmed` is set to `true` in the database
- On next API restart, the seeder resets it back to `false` for easy development

## Production Behavior

In production, you should:
1. Remove or comment out the MFA seeding logic in `DbSeeder.cs`
2. Let real admin users enroll via the UI (they'll see the QR code on first login)
3. Never use the hardcoded secret `JBSWY3DPEHPK3PXP`

## Legacy Scripts (No Longer Needed)

The following scripts are now obsolete but kept for reference:
- `reset-admin-mfa.ps1` - PowerShell script to delete MFA secrets
- `reset-admin-mfa.sql` - SQL script to delete MFA secrets
- `reset-admin-mfa-unconfirmed.sql` - SQL script to create unconfirmed MFA secret

You can delete these files if you want - the seeder handles everything automatically now.
