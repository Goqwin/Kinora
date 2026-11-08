import { customType } from "drizzle-orm/pg-core";

/** Postgres tsvector (typically generated). Read-only in app code. */
export const tsvector = customType<{ data: string; driverData: string }>({
  dataType() {
    return "tsvector";
  },
});
