CREATE TABLE candidate_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL UNIQUE REFERENCES interview_sessions(id) ON DELETE CASCADE,
    skills JSONB NOT NULL DEFAULT '[]',
    experiences JSONB NOT NULL DEFAULT '[]',
    projects JSONB NOT NULL DEFAULT '[]',
    education JSONB NOT NULL DEFAULT '[]',
    achievements JSONB NOT NULL DEFAULT '[]',
    jd_gap_analysis JSONB NOT NULL DEFAULT '{}',
    parsed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
