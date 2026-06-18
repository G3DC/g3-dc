-- G3 contact submissions
--
-- The API creates this table automatically on first request, but you can run
-- this manually too:  psql "$DATABASE_URL" -f db/schema.sql

CREATE TABLE IF NOT EXISTS contact_submissions (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name         text        NOT NULL,
  email        text        NOT NULL,
  company      text,
  need         text,
  message      text,
  source       text,                              -- e.g. 'website-contact-modal'
  ip           text,
  user_agent   text,
  email_status text        NOT NULL DEFAULT 'pending',  -- pending | sent | failed
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Recent-first browsing of leads.
CREATE INDEX IF NOT EXISTS contact_submissions_created_at_idx
  ON contact_submissions (created_at DESC);
