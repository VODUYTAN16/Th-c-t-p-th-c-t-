CREATE TYPE document_type AS ENUM ('cv', 'jd');
CREATE TYPE parse_status AS ENUM ('pending', 'processing', 'done', 'failed');
CREATE TYPE session_status AS ENUM ('draft', 'parsing', 'ready', 'active', 'evaluating', 'completed', 'failed');
CREATE TYPE question_category AS ENUM ('screening', 'technical', 'behavioral', 'project');
CREATE TYPE message_role AS ENUM ('interviewer', 'candidate', 'system');
CREATE TYPE message_type AS ENUM ('question', 'answer', 'follow_up', 'system');
CREATE TYPE app_language AS ENUM ('vi', 'en');
CREATE TYPE embedding_section AS ENUM ('skill', 'experience', 'project', 'education', 'jd');
