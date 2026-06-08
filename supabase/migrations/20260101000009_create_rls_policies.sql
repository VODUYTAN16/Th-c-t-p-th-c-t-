ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_reports ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Documents
CREATE POLICY "Users read own documents" ON documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own documents" ON documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own documents" ON documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own documents" ON documents FOR DELETE USING (auth.uid() = user_id);

-- Interview sessions
CREATE POLICY "Users read own sessions" ON interview_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sessions" ON interview_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sessions" ON interview_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own sessions" ON interview_sessions FOR DELETE USING (auth.uid() = user_id);

-- Candidate profiles (via session ownership)
CREATE POLICY "Users read own candidate_profiles" ON candidate_profiles FOR SELECT
    USING (EXISTS (SELECT 1 FROM interview_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));
CREATE POLICY "Users insert own candidate_profiles" ON candidate_profiles FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM interview_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));

-- Document embeddings
CREATE POLICY "Users read own embeddings" ON document_embeddings FOR SELECT
    USING (EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.user_id = auth.uid()));

-- Questions
CREATE POLICY "Users read own questions" ON questions FOR SELECT
    USING (EXISTS (SELECT 1 FROM interview_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));

-- Messages
CREATE POLICY "Users read own messages" ON messages FOR SELECT
    USING (EXISTS (SELECT 1 FROM interview_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));

-- Answer evaluations
CREATE POLICY "Users read own evaluations" ON answer_evaluations FOR SELECT
    USING (EXISTS (SELECT 1 FROM interview_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));

-- Interview reports
CREATE POLICY "Users read own reports" ON interview_reports FOR SELECT
    USING (EXISTS (SELECT 1 FROM interview_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));

-- Service role bypasses RLS automatically
