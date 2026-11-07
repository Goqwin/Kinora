-- Kinora account preferences extensions
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS interest_tags text[],
  ADD COLUMN IF NOT EXISTS child_first_names text[],
  ADD COLUMN IF NOT EXISTS open_to_meet_parents boolean NOT NULL DEFAULT false;
