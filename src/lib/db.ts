import postgres from "postgres";
import fs from "fs";
import path from "path";

// Zero-dependency local .env file loader for scripts and local dev context
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const firstEquals = trimmed.indexOf("=");
      if (firstEquals === -1) continue;
      const key = trimmed.slice(0, firstEquals).trim();
      let val = trimmed.slice(firstEquals + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
} catch (e) {
  // Silent catch for environments where fs is restricted or process.cwd() is inaccessible
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required but missing.");
}

let sqlClient: postgres.Sql;

try {
  sqlClient = postgres(connectionString, {
    ssl: "require",
    max: 3,
    idle_timeout: 10,
    connect_timeout: 10,
  });
  // Auto-initialize daily_letters table to prevent SQL errors in serverless execution
  sqlClient`
    CREATE TABLE IF NOT EXISTS daily_letters (
      id bigserial PRIMARY KEY,
      day_number integer NOT NULL UNIQUE,
      topic text NOT NULL,
      letter_json jsonb NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  `.catch(err => console.error("Failed to auto-create daily_letters table:", err));
} catch (error) {
  console.error("Failed to initialize database client");
  throw error;
}

export const sql = sqlClient;
export default sql;
