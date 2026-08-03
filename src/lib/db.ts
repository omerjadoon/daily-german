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

let sqlClient: postgres.Sql | null = null;

if (connectionString) {
  try {
    sqlClient = postgres(connectionString, {
      ssl: "require",
      max: 3,
      idle_timeout: 5,
      connect_timeout: 3,
      timeout: 4, // strict query timeout in seconds
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
    console.error("Failed to initialize database client:", error);
  }
} else {
  console.warn("[Database] DATABASE_URL is missing. Database queries will throw a runtime error.");
}

// Lazy-evaluate query requests so that import-time crashes are prevented
export const sql = ((strings: any, ...values: any[]) => {
  if (!sqlClient) {
    throw new Error("DATABASE_URL environment variable is missing. Please configure it in your environment/Netlify settings.");
  }
  return sqlClient(strings, ...values);
}) as unknown as postgres.Sql;

// Attach helper properties for library compatibility
if (sqlClient) {
  (sql as any).end = sqlClient.end;
} else {
  (sql as any).end = async () => {};
}

export default sql;
