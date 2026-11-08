import { config } from "dotenv";
import { existsSync } from "node:fs";
import { join } from "node:path";

/** Load `.env.local` then `.env` for CLI scripts (migrate, seed). */
export function loadEnvLocal(): void {
  const localPath = join(process.cwd(), ".env.local");
  if (existsSync(localPath)) {
    config({ path: localPath, override: true });
  }
  config();
}
