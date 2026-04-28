using Microsoft.Data.Sqlite;

Console.WriteLine("Fixing migration conflict...");

var dbPath = "../Filamorfosis.API/filamorfosis.db";
if (!File.Exists(dbPath))
{
    Console.WriteLine($"Error: Database file not found at {dbPath}");
    return 1;
}

Console.WriteLine($"Database found: {dbPath}");

using var connection = new SqliteConnection($"Data Source={dbPath}");
connection.Open();

// Check if use_cases column exists
Console.WriteLine("\nChecking if use_cases column exists...");
using (var cmd = connection.CreateCommand())
{
    cmd.CommandText = "SELECT COUNT(*) FROM pragma_table_info('Products') WHERE name = 'use_cases';";
    var columnExists = Convert.ToInt32(cmd.ExecuteScalar());
    
    if (columnExists == 1)
    {
        Console.WriteLine("✓ use_cases column exists");
    }
    else
    {
        Console.WriteLine("✗ use_cases column does NOT exist");
        Console.WriteLine("Please run PRODUCT-USE-CASE-TAGGING.sql first");
        return 1;
    }
}

// Create __EFMigrationsHistory table if it doesn't exist
Console.WriteLine("\nEnsuring __EFMigrationsHistory table exists...");
using (var cmd = connection.CreateCommand())
{
    cmd.CommandText = @"
        CREATE TABLE IF NOT EXISTS __EFMigrationsHistory (
            MigrationId TEXT NOT NULL PRIMARY KEY,
            ProductVersion TEXT NOT NULL
        );";
    cmd.ExecuteNonQuery();
    Console.WriteLine("✓ __EFMigrationsHistory table ready");
}

// Check if migration is already applied
Console.WriteLine("\nChecking if migration is already applied...");
using (var cmd = connection.CreateCommand())
{
    cmd.CommandText = "SELECT COUNT(*) FROM __EFMigrationsHistory WHERE MigrationId = '20260428060256_AddUseCasesToProducts';";
    var migrationExists = Convert.ToInt32(cmd.ExecuteScalar());
    
    if (migrationExists == 1)
    {
        Console.WriteLine("✓ Migration already marked as applied");
        Console.WriteLine("\nNo action needed. You can now run the application.");
        return 0;
    }
}

// Mark migration as applied
Console.WriteLine("\nMarking migration as applied...");
using (var cmd = connection.CreateCommand())
{
    cmd.CommandText = @"
        INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion) 
        VALUES ('20260428060256_AddUseCasesToProducts', '8.0.0');";
    cmd.ExecuteNonQuery();
}

// Verify
Console.WriteLine("\nVerifying...");
using (var cmd = connection.CreateCommand())
{
    cmd.CommandText = "SELECT MigrationId, ProductVersion FROM __EFMigrationsHistory WHERE MigrationId = '20260428060256_AddUseCasesToProducts';";
    using var reader = cmd.ExecuteReader();
    
    if (reader.Read())
    {
        Console.WriteLine("✓ Migration successfully marked as applied");
        Console.WriteLine($"\nMigration ID: {reader.GetString(0)}");
        Console.WriteLine($"Product Version: {reader.GetString(1)}");
        Console.WriteLine("\n✓ Fix complete! You can now run the application.");
        return 0;
    }
    else
    {
        Console.WriteLine("✗ Failed to mark migration as applied");
        return 1;
    }
}
