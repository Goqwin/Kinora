-- Widen user_preferences age-band check so Kinora app bands (ages_*) and
-- seed bands (0-2, 3-5, ...) both validate. Paste into Supabase SQL Editor.

ALTER TABLE public.user_preferences
  DROP CONSTRAINT IF EXISTS user_prefs_child_age_bands_check;

ALTER TABLE public.user_preferences
  ADD CONSTRAINT user_prefs_child_age_bands_check
  CHECK (
    child_age_bands IS NULL
    OR child_age_bands <@ ARRAY[
      '0-2',
      '3-5',
      '6-9',
      '10-13',
      '14-17',
      'ages_0_3',
      'ages_3_8',
      'ages_8_12',
      'ages_12_17',
      'ages_18_plus'
    ]::text[]
  );
