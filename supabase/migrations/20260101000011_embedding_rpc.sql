CREATE OR REPLACE FUNCTION insert_document_embedding(
    p_document_id UUID,
    p_session_id UUID,
    p_chunk_index INT,
    p_section_type TEXT,
    p_chunk_text TEXT,
    p_embedding TEXT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO document_embeddings (document_id, session_id, chunk_index, section_type, chunk_text, embedding)
    VALUES (
        p_document_id,
        p_session_id,
        p_chunk_index,
        p_section_type::embedding_section,
        p_chunk_text,
        p_embedding::vector
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
