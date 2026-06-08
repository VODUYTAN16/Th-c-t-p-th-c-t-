CREATE TABLE answer_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    score_content NUMERIC(4,2) NOT NULL,
    score_relevance NUMERIC(4,2) NOT NULL,
    score_completeness NUMERIC(4,2) NOT NULL,
    score_presentation NUMERIC(4,2) NOT NULL,
    score_overall NUMERIC(4,2) NOT NULL,
    strengths TEXT[] NOT NULL DEFAULT '{}',
    weaknesses TEXT[] NOT NULL DEFAULT '{}',
    feedback TEXT NOT NULL,
    sample_answer TEXT,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(session_id, question_id)
);

CREATE TABLE interview_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL UNIQUE REFERENCES interview_sessions(id) ON DELETE CASCADE,
    overall_score NUMERIC(4,2) NOT NULL,
    avg_content NUMERIC(4,2) NOT NULL,
    avg_relevance NUMERIC(4,2) NOT NULL,
    avg_completeness NUMERIC(4,2) NOT NULL,
    avg_presentation NUMERIC(4,2) NOT NULL,
    summary TEXT NOT NULL,
    cv_suggestions JSONB NOT NULL DEFAULT '[]',
    pdf_bucket TEXT,
    pdf_path TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
