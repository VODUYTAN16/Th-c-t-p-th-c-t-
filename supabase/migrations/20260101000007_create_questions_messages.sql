CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    category question_category NOT NULL,
    question_text TEXT NOT NULL,
    order_index INT NOT NULL,
    is_follow_up BOOLEAN NOT NULL DEFAULT false,
    parent_question_id UUID REFERENCES questions(id),
    source_context JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_session_order ON questions(session_id, order_index);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id),
    role message_role NOT NULL,
    message_type message_type NOT NULL,
    content TEXT NOT NULL,
    audio_bucket TEXT,
    audio_path TEXT,
    sequence_number INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_session_seq ON messages(session_id, sequence_number);
