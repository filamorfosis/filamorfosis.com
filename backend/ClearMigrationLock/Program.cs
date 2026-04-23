using System;
using System.IO;
using Microsoft.Data.Sqlite;

var dbPath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../Filamorfosis.API/filamorfosis.db"));
Console.WriteLine($"DB: {dbPath}");

using var conn = new SqliteConnection($"Data Source={dbPath}");
conn.Open();

using var cmd = conn.CreateCommand();
cmd.CommandText = "DELETE FROM __EFMigrationsLock;";
var rows = cmd.ExecuteNonQuery();
Console.WriteLine($"Deleted {rows} lock row(s). Done.");
