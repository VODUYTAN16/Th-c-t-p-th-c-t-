CREATE TABLE document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    section_type embedding_section NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding vector(384) NOT NULL
);

CREATE INDEX idx_document_embeddings_document ON document_embeddings(document_id);
CREATE INDEX idx_document_embeddings_hnsw ON document_embeddings
    USING hnsw (embedding vector_cosine_ops);
