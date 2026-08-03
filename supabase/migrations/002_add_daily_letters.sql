-- Migration: Add daily_letters table for caching B1 letter writing practice
CREATE TABLE IF NOT EXISTS daily_letters (
    id bigserial PRIMARY KEY,
    day_number integer NOT NULL UNIQUE,
    topic text NOT NULL,
    letter_json jsonb NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_letters_day ON daily_letters(day_number);
