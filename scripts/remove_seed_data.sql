-- Removes ALL fake seed rows (families + organizations). Real rows are untouched.
-- Leaves the schema changes and the neighbourhoods table in place.
BEGIN;

-- Anything a seed user created elsewhere (saved resources, posts...) would
-- block the delete via FK; clear those first if your app has added any, e.g.:
-- DELETE FROM public.saved_resources WHERE user_id IN (SELECT id FROM public.users WHERE is_seed);

DELETE FROM public.user_preferences
WHERE user_id IN (SELECT id FROM public.users WHERE is_seed);

DELETE FROM public.users WHERE is_seed;

DELETE FROM public.resources WHERE seed_id IS NOT NULL;

COMMIT;