CREATE TABLE interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT,
    position_applied TEXT NOT NULL,
    industry TEXT,
    language app_language NOT NULL DEFAULT 'vi',
    status session_status NOT NULL DEFAULT 'draft',
    cv_document_id UUID NOT NULL REFERENCES documents(id),
    jd_document_id UUID REFERENCES documents(id),
    current_question_index INT NOT NULL DEFAULT 0,
    follow_up_count INT NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_user_status ON interview_sessions(user_id, status);
CREATE INDEX idx_sessions_user_created ON interview_sessions(user_id, created_at DESC);

CREATE TRIGGER interview_sessions_updated_at
    BEFORE UPDATE ON interview_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
