// drizzle-kit emits `geometry(point)` without the SRID and doesn't add the
// extension. Run after `drizzle-kit generate` (npm run db:generate does this).
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
for (const f of readdirSync("drizzle").filter((f) => f.endsWith(".sql"))) {
  let s = readFileSync(`drizzle/${f}`, "utf8");
  s = s.replace(/geometry\(point\)/g, "geometry(point, 4326)");
  if (s.includes('CREATE TABLE "resources"') && !s.includes("CREATE EXTENSION")) {
    s = "CREATE EXTENSION IF NOT EXISTS postgis;--> statement-breakpoint\n" + s;
  }
  writeFileSync(`drizzle/${f}`, s);
}
