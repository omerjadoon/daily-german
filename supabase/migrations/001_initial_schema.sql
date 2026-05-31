-- 1. app_settings
CREATE TABLE IF NOT EXISTS app_settings (
    key text PRIMARY KEY,
    value text NOT NULL,
    updated_at timestamptz DEFAULT now()
);

-- 2. curriculum_topics
CREATE TABLE IF NOT EXISTS curriculum_topics (
    id bigserial PRIMARY KEY,
    day_number integer NOT NULL UNIQUE,
    level text NOT NULL,
    topic text NOT NULL,
    scenario text NOT NULL,
    grammar_focus text[] NOT NULL DEFAULT '{}',
    vocabulary_theme text,
    telc_skill text,
    created_at timestamptz DEFAULT now()
);

-- 3. generated_lessons
CREATE TABLE IF NOT EXISTS generated_lessons (
    id bigserial PRIMARY KEY,
    day_number integer NOT NULL UNIQUE,
    topic_id bigint REFERENCES curriculum_topics(id) ON DELETE SET NULL,
    lesson_json jsonb NOT NULL,
    model text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. sent_lessons
CREATE TABLE IF NOT EXISTS sent_lessons (
    id bigserial PRIMARY KEY,
    day_number integer NOT NULL,
    email_to text NOT NULL,
    subject text NOT NULL,
    topic text NOT NULL,
    level text NOT NULL,
    sent_at timestamptz DEFAULT now(),
    provider_message_id text,
    status text NOT NULL DEFAULT 'sent',
    UNIQUE(day_number, email_to)
);

-- 5. vocabulary_items
CREATE TABLE IF NOT EXISTS vocabulary_items (
    id bigserial PRIMARY KEY,
    day_number integer NOT NULL,
    german text NOT NULL,
    article text NOT NULL DEFAULT '—',
    plural text,
    english text NOT NULL,
    example_german text,
    ease_score numeric DEFAULT 2.5,
    review_count integer DEFAULT 0,
    last_reviewed_at timestamptz,
    next_review_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- 6. lesson_events
CREATE TABLE IF NOT EXISTS lesson_events (
    id bigserial PRIMARY KEY,
    event_type text NOT NULL,
    day_number integer,
    message text,
    metadata jsonb,
    created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sent_lessons_day_email ON sent_lessons(day_number, email_to);
CREATE INDEX IF NOT EXISTS idx_vocabulary_items_day ON vocabulary_items(day_number);
CREATE INDEX IF NOT EXISTS idx_vocabulary_items_next_review ON vocabulary_items(next_review_at);
CREATE INDEX IF NOT EXISTS idx_lesson_events_created ON lesson_events(created_at);
CREATE INDEX IF NOT EXISTS idx_generated_lessons_day ON generated_lessons(day_number);
