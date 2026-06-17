import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// drizzle-kit 是獨立 CLI，需自行載入 .env
config({ path: ".env" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
