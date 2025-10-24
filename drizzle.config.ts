import { defineConfig } from "drizzle-kit";

// Priorizar AIVEN_DATABASE_URL se existir, senão usar DATABASE_URL
const connectionString = process.env.AIVEN_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("AIVEN_DATABASE_URL or DATABASE_URL is required to run drizzle commands");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: connectionString,
  },
});
