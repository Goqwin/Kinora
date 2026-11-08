-- =====================================================================
-- Migration: make the schema able to store seed_data.py (families) and
-- seed_organizations.py (organizations).
--
-- Mapping:
--   families.json      -> public.users + public.user_preferences
--   organizations.json -> public.resources
--
-- v2 changes (vs Tanek's v1):
--   * all 10 neighbourhoods (v1 only had the original 5 -> FK failures)
--   * neighbourhoods get an approximate centre point, so seed rows get a
--     location and the map / distance features work for them
--   * resources.location stays NOT NULL and there are NO new defaults for
--     cost_type / source_url / last_verified_at. The loader sets those
--     explicitly for seed rows, so a real insert that forgets them still
--     fails loudly instead of looking "verified just now".
--   * cost_type 'unknown' is only allowed on seed rows
--   * re-runnable: constraints are dropped-if-exists before being added
--   * neighbourhood FKs cascade on rename
--
-- Runs in one transaction. Existing rows are not modified.
-- =====================================================================
BEGIN;

-- ---------------------------------------------------------------------
-- 1. Neighbourhood lookup. Keep in step with neighbourhoods.py.
--    Names and FSAs are fake; centres are rough points spread around
--    Calgary so map pins land somewhere sensible. (lon, lat, SRID 4326)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.neighbourhoods (
  name         text PRIMARY KEY,
  fsa_prefixes text[] NOT NULL
);
ALTER TABLE public.neighbourhoods
  ADD COLUMN IF NOT EXISTS centre geometry(Point, 4326);

INSERT INTO public.neighbourhoods (name, fsa_prefixes, centre) VALUES
  ('Maple Hollow', ARRAY['T2A','T2B'], ST_SetSRID(ST_MakePoint(-113.985, 51.050), 4326)),
  ('Riverbend',    ARRAY['T2C','T2E'], ST_SetSRID(ST_MakePoint(-114.000, 50.980), 4326)),
  ('Cedar Ridge',  ARRAY['T3A','T3B'], ST_SetSRID(ST_MakePoint(-114.150, 51.110), 4326)),
  ('Parkview',     ARRAY['T2H','T2J'], ST_SetSRID(ST_MakePoint(-114.060, 50.960), 4326)),
  ('Lakeside',     ARRAY['T3C','T3E'], ST_SetSRID(ST_MakePoint(-114.130, 51.030), 4326)),
  ('Ironwood',     ARRAY['T2K','T2L'], ST_SetSRID(ST_MakePoint(-114.080, 51.100), 4326)),
  ('Stonegate',    ARRAY['T2M','T2N'], ST_SetSRID(ST_MakePoint(-114.090, 51.065), 4326)),
  ('Birchwood',    ARRAY['T2P','T2R'], ST_SetSRID(ST_MakePoint(-114.065, 51.040), 4326)),
  ('Foxglen',      ARRAY['T3G','T3H'], ST_SetSRID(ST_MakePoint(-114.200, 51.140), 4326)),
  ('Summit Park',  ARRAY['T3J','T3K'], ST_SetSRID(ST_MakePoint(-113.960, 51.120), 4326))
ON CONFLICT (name) DO UPDATE
  SET fsa_prefixes = EXCLUDED.fsa_prefixes,
      centre       = EXCLUDED.centre;


-- ---------------------------------------------------------------------
-- 2. FAMILIES  ->  users + user_preferences
-- ---------------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS seed_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS is_seed boolean NOT NULL DEFAULT false;

-- Only the FSA (first 3 chars) is stored, never the full postal code.
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS neighbourhood text
    REFERENCES public.neighbourhoods(name) ON UPDATE CASCADE,
  ADD COLUMN IF NOT EXISTS parent_gender text,
  ADD COLUMN IF NOT EXISTS child_genders text[];   -- same order as child_age_bands

ALTER TABLE public.user_preferences
  DROP CONSTRAINT IF EXISTS user_prefs_parent_gender_check,
  DROP CONSTRAINT IF EXISTS user_prefs_child_age_bands_check,
  DROP CONSTRAINT IF EXISTS user_prefs_child_genders_check,
  DROP CONSTRAINT IF EXISTS user_prefs_child_lists_aligned_check;

-- NOT VALID = only new/updated rows are checked, so existing data can't
-- block the migration. Run the VALIDATE lines at the bottom afterwards.
ALTER TABLE public.user_preferences
  ADD CONSTRAINT user_prefs_parent_gender_check
    CHECK (parent_gender IS NULL OR parent_gender = ANY (
      ARRAY['Woman','Man','Non-binary','Prefer not to say'])) NOT VALID,
  ADD CONSTRAINT user_prefs_child_age_bands_check
    CHECK (child_age_bands IS NULL OR child_age_bands::text[] <@
      ARRAY['0-2','3-5','6-9','10-13','14-17']) NOT VALID,
  ADD CONSTRAINT user_prefs_child_genders_check
    CHECK (child_genders IS NULL OR child_genders <@
      ARRAY['Girl','Boy','Non-binary','Prefer not to say']) NOT VALID,
  ADD CONSTRAINT user_prefs_child_lists_aligned_check
    CHECK (child_genders IS NULL OR (
      child_age_bands IS NOT NULL
      AND cardinality(child_genders) = cardinality(child_age_bands))) NOT VALID;

CREATE INDEX IF NOT EXISTS user_preferences_neighbourhood_idx
  ON public.user_preferences (neighbourhood);


-- ---------------------------------------------------------------------
-- 3. ORGANIZATIONS  ->  resources
-- ---------------------------------------------------------------------
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS seed_id            text UNIQUE,
  ADD COLUMN IF NOT EXISTS neighbourhood      text
    REFERENCES public.neighbourhoods(name) ON UPDATE CASCADE,
  ADD COLUMN IF NOT EXISTS suitable_age_bands text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS suitable_genders   text[] NOT NULL DEFAULT '{All}';

ALTER TABLE public.resources
  DROP CONSTRAINT IF EXISTS resources_suitable_age_bands_check,
  DROP CONSTRAINT IF EXISTS resources_suitable_genders_check,
  DROP CONSTRAINT IF EXISTS resources_unknown_cost_seed_only_check;

ALTER TABLE public.resources
  ADD CONSTRAINT resources_suitable_age_bands_check
    CHECK (suitable_age_bands <@
      ARRAY['0-2','3-5','6-9','10-13','14-17','Adults']),
  ADD CONSTRAINT resources_suitable_genders_check
    CHECK (suitable_genders <@
      ARRAY['All','Woman','Man','Girl','Boy','Non-binary']);

-- cost_type: allow 'unknown', but ONLY on seed rows.
-- The existing CHECK may not be named resources_cost_type_check in the
-- real DB, so drop whichever CHECK constraint is about cost_type.
DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.resources'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%cost_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.resources DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE public.resources
  ADD CONSTRAINT resources_cost_type_check
    CHECK (cost_type = ANY (ARRAY['free','subsidized','income_based','paid','unknown'])),
  ADD CONSTRAINT resources_unknown_cost_seed_only_check
    CHECK (cost_type <> 'unknown' OR seed_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS resources_neighbourhood_idx
  ON public.resources (neighbourhood);
CREATE INDEX IF NOT EXISTS resources_suitable_age_bands_idx
  ON public.resources USING gin (suitable_age_bands);
CREATE INDEX IF NOT EXISTS resources_suitable_genders_idx
  ON public.resources USING gin (suitable_genders);

-- org "type" -> resources.category. The loader also overrides a few
-- specific orgs (food pantry -> food, housing intake -> housing,
-- legal aid -> legal_info).
CREATE OR REPLACE FUNCTION public.org_type_to_category(org_type text)
RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE org_type
    WHEN 'Daycare'                THEN 'childcare'
    WHEN 'Support program'        THEN 'community'
    WHEN 'Child services'         THEN 'health_family'
    WHEN 'Government assistance'  THEN 'financial'
    WHEN 'Outreach'               THEN 'community'
    WHEN 'Youth program'          THEN 'activities'
    ELSE 'community'
  END
$$;

COMMIT;


-- =====================================================================
-- After loading and checking existing data, validate the NOT VALID ones:
-- =====================================================================
-- ALTER TABLE public.user_preferences VALIDATE CONSTRAINT user_prefs_parent_gender_check;
-- ALTER TABLE public.user_preferences VALIDATE CONSTRAINT user_prefs_child_age_bands_check;
-- ALTER TABLE public.user_preferences VALIDATE CONSTRAINT user_prefs_child_genders_check;
-- ALTER TABLE public.user_preferences VALIDATE CONSTRAINT user_prefs_child_lists_aligned_check;