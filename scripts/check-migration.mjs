// Runs the generated migration against in-memory Postgres + PostGIS (PGlite),
// inserts a resource, and checks the generated location + an indexed radius query.
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { postgis } from "@electric-sql/pglite-postgis";

const db = await PGlite.create({ extensions: { postgis } });
for (const f of readdirSync("drizzle").filter((f) => f.endsWith(".sql")).sort()) {
  for (const stmt of readFileSync(`drizzle/${f}`, "utf8").split("--> statement-breakpoint")) {
    if (stmt.trim()) await db.exec(stmt);
  }
}
await db.query(`INSERT INTO resources (slug,name,description,categories,lat,lng,cost_type,cost_monthly_cad,age_min_years,age_max_years,source,last_verified_at)
  VALUES ('test-daycare','Test Daycare','x','{childcare}',51.037,-114.075,'subsidized',0,0,5,'test',now())`);
const r = await db.query(`SELECT slug, ST_SRID(location) srid,
  round(ST_Distance(location::geography, ST_SetSRID(ST_MakePoint(-114.068,51.048),4326)::geography)) AS metres
  FROM resources WHERE ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint(-114.068,51.048),4326)::geography, 5000)`);
console.log(r.rows);
let bad = "ok";
try { await db.query(`INSERT INTO resources (slug,kind,name,description,categories,lat,lng,cost_type,source,last_verified_at)
  VALUES ('e','event','E','x','{community_events}',51,-114,'free','t',now())`); bad = "event-without-date accepted!"; } catch { /* expected */ }
console.log("event check:", bad);
