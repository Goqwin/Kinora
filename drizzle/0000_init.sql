CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth0_sub text NOT NULL UNIQUE,
  email text,
  display_name text UNIQUE,
  role text NOT NULL DEFAULT 'user',
  rules_accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'))
);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  postal_fsa text,
  approx_location geography(Point,4326),
  child_age_bands text[],
  categories text[],
  interest_tags text[],
  child_first_names text[],
  open_to_meet_parents boolean NOT NULL DEFAULT false,
  budget_band text,
  language text NOT NULL DEFAULT 'en',
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT user_preferences_postal_fsa_check CHECK (
    postal_fsa IS NULL OR char_length(postal_fsa) = 3
  )
);

CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  subcategory text,
  address_line text,
  city text DEFAULT 'Calgary',
  postal_code text,
  location geography(Point,4326) NOT NULL,
  cost_type text NOT NULL,
  cost_notes text,
  age_min_months int,
  age_max_months int,
  eligibility_summary text,
  eligibility_requirements text[],
  languages text[] DEFAULT '{en}',
  phone text,
  email text,
  website text,
  source_url text NOT NULL,
  last_verified_at timestamptz NOT NULL,
  verified_by text,
  is_active boolean NOT NULL DEFAULT true,
  search_tsv tsvector GENERATED ALWAYS AS (
    to_tsvector(
      'english',
      coalesce(name, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(eligibility_summary, '')
    )
  ) STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT resources_category_check CHECK (
    category IN (
      'childcare', 'financial', 'housing', 'food',
      'health_family', 'community', 'activities', 'legal_info'
    )
  ),
  CONSTRAINT resources_cost_type_check CHECK (
    cost_type IN ('free', 'subsidized', 'income_based', 'paid')
  ),
  CONSTRAINT resources_age_range_check CHECK (
    age_min_months IS NULL OR age_max_months IS NULL OR age_min_months <= age_max_months
  )
);

CREATE INDEX IF NOT EXISTS resources_location_idx ON resources USING GIST (location);
CREATE INDEX IF NOT EXISTS resources_category_idx ON resources (category);
CREATE INDEX IF NOT EXISTS resources_active_category_idx ON resources (is_active, category);
CREATE INDEX IF NOT EXISTS resources_search_tsv_idx ON resources USING GIN (search_tsv);

CREATE TABLE IF NOT EXISTS saved_resources (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, resource_id)
);

CREATE INDEX IF NOT EXISTS saved_resources_user_idx ON saved_resources (user_id, created_at);

CREATE TABLE IF NOT EXISTS support_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  criteria jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_plans_user_created_idx
  ON support_plans (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS plan_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES support_plans(id) ON DELETE CASCADE,
  resource_id uuid REFERENCES resources(id) ON DELETE SET NULL,
  title text NOT NULL,
  reason text NOT NULL,
  first_step text NOT NULL,
  priority int NOT NULL,
  status text NOT NULL DEFAULT 'todo',
  completed_at timestamptz,
  CONSTRAINT plan_actions_status_check CHECK (status IN ('todo', 'done')),
  CONSTRAINT plan_actions_priority_check CHECK (priority >= 0)
);

CREATE INDEX IF NOT EXISTS plan_actions_plan_priority_idx ON plan_actions (plan_id, priority);

CREATE TABLE IF NOT EXISTS user_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id uuid REFERENCES resources(id) ON DELETE SET NULL,
  plan_action_id uuid REFERENCES plan_actions(id) ON DELETE SET NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'todo',
  due_date timestamptz,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT user_tasks_status_check CHECK (status IN ('todo', 'done'))
);

CREATE INDEX IF NOT EXISTS user_tasks_user_status_idx ON user_tasks (user_id, status);

CREATE TABLE IF NOT EXISTS resource_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  type text NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT resource_feedback_type_check CHECK (
    type IN ('outdated', 'wrong_info', 'closed', 'other')
  ),
  CONSTRAINT resource_feedback_status_check CHECK (
    status IN ('open', 'resolved', 'dismissed')
  ),
  CONSTRAINT resource_feedback_note_len_check CHECK (
    note IS NULL OR char_length(note) <= 500
  )
);

CREATE INDEX IF NOT EXISTS resource_feedback_status_idx ON resource_feedback (status, created_at);
CREATE INDEX IF NOT EXISTS resource_feedback_resource_idx ON resource_feedback (resource_id);

CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category text NOT NULL,
  resource_id uuid REFERENCES resources(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  moderation jsonb,
  helpful_count int NOT NULL DEFAULT 0,
  search_tsv tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))
  ) STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT community_posts_category_check CHECK (
    category IN (
      'childcare', 'financial', 'housing', 'food',
      'health_family', 'activities', 'other'
    )
  ),
  CONSTRAINT community_posts_status_check CHECK (
    status IN ('pending', 'published', 'flagged', 'removed')
  ),
  CONSTRAINT community_posts_title_len_check CHECK (char_length(title) <= 120),
  CONSTRAINT community_posts_body_len_check CHECK (char_length(body) <= 2000),
  CONSTRAINT community_posts_helpful_count_check CHECK (helpful_count >= 0)
);

CREATE INDEX IF NOT EXISTS community_posts_status_category_idx
  ON community_posts (status, category, created_at DESC);
CREATE INDEX IF NOT EXISTS community_posts_author_created_idx
  ON community_posts (author_id, created_at);
CREATE INDEX IF NOT EXISTS community_posts_resource_idx
  ON community_posts (resource_id, status);
CREATE INDEX IF NOT EXISTS community_posts_search_tsv_idx
  ON community_posts USING GIN (search_tsv);

CREATE TABLE IF NOT EXISTS community_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  moderation jsonb,
  helpful_count int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT community_replies_status_check CHECK (
    status IN ('pending', 'published', 'flagged', 'removed')
  ),
  CONSTRAINT community_replies_body_len_check CHECK (char_length(body) <= 1000),
  CONSTRAINT community_replies_helpful_count_check CHECK (helpful_count >= 0)
);

CREATE INDEX IF NOT EXISTS community_replies_post_idx ON community_replies (post_id, status);
CREATE INDEX IF NOT EXISTS community_replies_author_created_idx
  ON community_replies (author_id, created_at);

CREATE TABLE IF NOT EXISTS community_votes (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, target_type, target_id),
  CONSTRAINT community_votes_target_type_check CHECK (target_type IN ('post', 'reply'))
);

CREATE INDEX IF NOT EXISTS community_votes_target_idx ON community_votes (target_type, target_id);

CREATE TABLE IF NOT EXISTS community_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  reason text NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'open',
  resolved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT community_reports_target_type_check CHECK (target_type IN ('post', 'reply')),
  CONSTRAINT community_reports_status_check CHECK (
    status IN ('open', 'actioned', 'dismissed')
  ),
  CONSTRAINT community_reports_reason_check CHECK (
    reason IN (
      'personal_info', 'harassment', 'scam_or_promo', 'unsafe_advice', 'other'
    )
  )
);

CREATE INDEX IF NOT EXISTS community_reports_reporter_created_idx
  ON community_reports (reporter_id, created_at);
CREATE INDEX IF NOT EXISTS community_reports_target_status_idx
  ON community_reports (target_type, target_id, status);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;
