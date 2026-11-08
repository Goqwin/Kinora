"""
Turn families.json + organizations.json into seed_load.sql.

    python build_seed_sql.py                      # reads ./families.json, ./organizations.json
    python build_seed_sql.py fam.json orgs.json   # custom paths

Then run migration_seed_data.sql once, and paste/run seed_load.sql in the
Supabase SQL editor (or: psql "$DATABASE_URL" -f seed_load.sql).

- Safe to run twice: ON CONFLICT (seed_id / user_id) DO NOTHING.
- Works with both the original generators (no "slug" field) and the
  scaled 10-neighbourhood versions (with "slug").
- Seed orgs and families get a location: their neighbourhood's centre
  point plus a small deterministic offset (~ up to 1 km), so pins don't
  stack on top of each other. Same input -> same SQL every time.
- Only the FSA (first 3 chars of the postal code) is stored for families.
"""
import hashlib
import json
import re
import sys

# Specific orgs that fit a more precise category than their "type" gives.
CATEGORY_OVERRIDES = {
    "Community Food Pantry & Meal Share": "food",
    "Housing Assistance Intake Centre": "housing",
    "Family Legal Aid Clinic": "legal_info",
}

# Age band -> (min_months, max_months) for resources.age_min/max_months
BAND_MONTHS = {
    "0-2": (0, 35), "3-5": (36, 71), "6-9": (72, 119),
    "10-13": (120, 167), "14-17": (168, 215),
}

JITTER_DEG = 0.009  # ~1 km in latitude; a bit less in longitude at Calgary


def q(value) -> str:
    """SQL literal for a string / None."""
    if value is None:
        return "NULL"
    return "'" + str(value).replace("'", "''") + "'"


def arr(values) -> str:
    """SQL text[] literal for a list / None."""
    if values is None:
        return "NULL"
    if not values:
        return "'{}'::text[]"
    return "ARRAY[" + ", ".join(q(v) for v in values) + "]::text[]"


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def offset(seed_id: str) -> tuple[float, float]:
    """Deterministic (dlon, dlat) in [-JITTER_DEG, JITTER_DEG] from the id."""
    h = hashlib.sha256(seed_id.encode()).digest()
    dx = (int.from_bytes(h[0:4], "big") / 0xFFFFFFFF * 2 - 1) * JITTER_DEG
    dy = (int.from_bytes(h[4:8], "big") / 0xFFFFFFFF * 2 - 1) * JITTER_DEG
    return round(dx, 6), round(dy, 6)


def point_near_centre(seed_id: str, hood: str) -> str:
    dx, dy = offset(seed_id)
    return (f"(SELECT ST_Translate(centre, {dx}, {dy}) "
            f"FROM public.neighbourhoods WHERE name = {q(hood)})")


def base_org_name(name: str) -> str:
    """'Dads Connect (Ironwood)' -> 'Dads Connect'."""
    return re.sub(r"\s*\([^)]*\)\s*$", "", name)


def family_sql(f: dict) -> str:
    fid = f["id"]
    fsa = (f.get("postal_code") or "")[:3] or None
    return f"""INSERT INTO public.users (auth0_sub, display_name, role, is_seed, seed_id)
VALUES ({q('seed|' + fid)}, {q(f['display_name'])}, 'user', true, {q(fid)})
ON CONFLICT (seed_id) DO NOTHING;
INSERT INTO public.user_preferences
  (user_id, postal_fsa, neighbourhood, approx_location,
   child_age_bands, child_genders, parent_gender)
SELECT u.id, {q(fsa)}, {q(f['neighbourhood'])}, {point_near_centre(fid, f['neighbourhood'])},
       {arr(f.get('children_age_ranges'))}, {arr(f.get('children_genders'))}, {q(f.get('parent_gender'))}
FROM public.users u WHERE u.seed_id = {q(fid)}
ON CONFLICT (user_id) DO NOTHING;
"""


def org_sql(o: dict) -> str:
    oid = o["id"]
    slug = o.get("slug") or slugify(o["name"])
    override = CATEGORY_OVERRIDES.get(base_org_name(o["name"]))
    category = q(override) if override else f"public.org_type_to_category({q(o['type'])})"
    child_bands = [b for b in o["suitable_ages"] if b in BAND_MONTHS]
    age_min = min(BAND_MONTHS[b][0] for b in child_bands) if child_bands else None
    age_max = max(BAND_MONTHS[b][1] for b in child_bands) if child_bands else None
    return f"""INSERT INTO public.resources
  (seed_id, slug, name, description, category, subcategory, neighbourhood,
   address_line, postal_code, location, cost_type, source_url, last_verified_at,
   suitable_age_bands, suitable_genders, age_min_months, age_max_months)
VALUES ({q(oid)}, {q(slug)}, {q(o['name'])}, {q(o['description'])}, {category}, {q(o['type'])}, {q(o['neighbourhood'])},
        {q(o['address'])}, {q(o['postal_code'])}, {point_near_centre(oid, o['neighbourhood'])},
        'unknown', 'seed://synthetic', now(),
        {arr(o['suitable_ages'])}, {arr(o['suitable_genders'])},
        {age_min if age_min is not None else 'NULL'}, {age_max if age_max is not None else 'NULL'})
ON CONFLICT (seed_id) DO NOTHING;
"""


def main() -> None:
    fam_path = sys.argv[1] if len(sys.argv) > 1 else "families.json"
    org_path = sys.argv[2] if len(sys.argv) > 2 else "organizations.json"
    with open(fam_path, encoding="utf-8") as fh:
        families = json.load(fh)
    with open(org_path, encoding="utf-8") as fh:
        orgs = json.load(fh)

    slugs = [o.get("slug") or slugify(o["name"]) for o in orgs]
    dupes = {s for s in slugs if slugs.count(s) > 1}
    if dupes:
        sys.exit(f"Duplicate org slugs would violate resources.slug UNIQUE: {sorted(dupes)}")

    parts = [
        "-- Generated by build_seed_sql.py. All data is FAKE.",
        f"-- {len(families)} families, {len(orgs)} organizations.",
        "-- Run migration_seed_data.sql first. Safe to run more than once.",
        "BEGIN;",
        "",
        "-- ===== Families -> users + user_preferences =====",
    ]
    parts += [family_sql(f) for f in families]
    parts += ["", "-- ===== Organizations -> resources ====="]
    parts += [org_sql(o) for o in orgs]
    parts += ["COMMIT;", ""]

    with open("seed_load.sql", "w", encoding="utf-8") as fh:
        fh.write("\n".join(parts))
    print(f"Wrote seed_load.sql ({len(families)} families, {len(orgs)} organizations)")


if __name__ == "__main__":
    main()