import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Supabase pooler connection — sslmode=no-verify required for self-signed certs
const DB_URL = (process.env.DATABASE_URL || "").replace("sslmode=require", "sslmode=no-verify");
const pool = new Pool({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });

export { schema };
