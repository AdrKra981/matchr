-- jobs
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    external_id TEXT UNIQUE NOT NULL,
    slug TEXT,
    title TEXT NOT NULL,
    company_name TEXT,
    city TEXT,
    workplace_type TEXT,
    experience_level TEXT,
    salary_from INTEGER,
    salary_to INTEGER,
    salary_currency TEXT,
    employment_type TEXT,
    url TEXT,
    description TEXT,
    skills JSONB,
    raw JSONB,
    published_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    fetched_at TIMESTAMPTZ DEFAULT now()
);