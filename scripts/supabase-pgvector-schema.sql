-- =============================================================================
-- DFFE & GITO Knowledge Assistant — Supabase / PostgreSQL pgvector Schema
-- =============================================================================
-- Implements Section 6 ("Store vectors and document metadata in Supabase pgvector")
-- and Section 7 ("Role-based access to different knowledge collections, POPIA,
-- and 3-Phase Information Management [FM/IM] Content Sensitivity Governance").
-- =============================================================================

-- 1. Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the chunk-level knowledge table across the 9 logical collections
CREATE TABLE IF NOT EXISTS public.dffe_knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id TEXT UNIQUE NOT NULL,
  collection_id TEXT NOT NULL CHECK (
    collection_id IN (
      'dffe_overview',
      'cms',
      'gito',
      'ict_governance',
      'ict_organogram',
      'digital_solutions',
      'infrastructure',
      'cybersecurity',
      'ict_operations'
    )
  ),
  collection_name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Expected metadata keys:
  --   source: TEXT (e.g. "Revised ICT Organogram (Revised_ICT_Organogram.pdf)")
  --   sourceId: TEXT ("OFFICIAL_PUBLIC" | "SOURCE_A" | "SOURCE_B" | "SOURCE_A_AND_B" | "DPSA_FRAMEWORK")
  --   page: TEXT or INTEGER (e.g. 1..7 or "Webpage")
  --   section: TEXT
  --   category: TEXT (e.g. "Organisational structure")
  --   status: TEXT ("Official" | "Proposed" | "Statutory" | "Historical")
  --   approvalCaveat: TEXT
  --   department: TEXT ("DFFE")
  --   branch: TEXT ("Corporate Management Services (CMS)")
  --   directorate: TEXT ("GITO")
  --   sensitivity: TEXT ("public" | "internal" | "restricted")
  --   url: TEXT
  status TEXT NOT NULL DEFAULT 'Proposed' CHECK (status IN ('Official', 'Proposed', 'Statutory', 'Historical')),
  sensitivity TEXT NOT NULL DEFAULT 'internal' CHECK (sensitivity IN ('public', 'internal', 'restricted')),
  keywords TEXT[] DEFAULT '{}',
  -- 1536 dimensions for OpenRouter openai/text-embedding-3-small
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes for fast metadata filtering & hybrid vector search
CREATE INDEX IF NOT EXISTS idx_dffe_chunks_collection ON public.dffe_knowledge_chunks (collection_id);
CREATE INDEX IF NOT EXISTS idx_dffe_chunks_status ON public.dffe_knowledge_chunks (status);
CREATE INDEX IF NOT EXISTS idx_dffe_chunks_sensitivity ON public.dffe_knowledge_chunks (sensitivity);
CREATE INDEX IF NOT EXISTS idx_dffe_chunks_metadata_gin ON public.dffe_knowledge_chunks USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_dffe_chunks_embedding_hnsw
  ON public.dffe_knowledge_chunks USING hnsw (embedding vector_cosine_ops);

-- 4. Row-Level Security (RLS) for 3-Phase FM/IM Sensitivity Governance & POPIA Audit
ALTER TABLE public.dffe_knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- Public citizens (Phase 2) can only read 'public' chunks
CREATE POLICY "Phase 2 Public Read Only Public Chunks"
  ON public.dffe_knowledge_chunks
  FOR SELECT
  USING (sensitivity = 'public');

-- Authenticated DFFE Internal Staff (@dffe.gov.za, Phase 1) can read 'public' and 'internal' chunks
CREATE POLICY "Phase 1 Internal Staff Read Public and Internal Chunks"
  ON public.dffe_knowledge_chunks
  FOR SELECT
  TO authenticated
  USING (sensitivity IN ('public', 'internal'));

-- 5. Similarity Search RPC Function with Collection, Status, and FM/IM Sensitivity Filtering
CREATE OR REPLACE FUNCTION public.match_dffe_chunks(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.25,
  match_count INT DEFAULT 5,
  filter_collection TEXT DEFAULT 'all',
  filter_status TEXT DEFAULT 'all',
  allowed_sensitivities TEXT[] DEFAULT ARRAY['public', 'internal']
)
RETURNS TABLE (
  chunk_id TEXT,
  collection_id TEXT,
  collection_name TEXT,
  title TEXT,
  content TEXT,
  metadata JSONB,
  status TEXT,
  sensitivity TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.chunk_id,
    c.collection_id,
    c.collection_name,
    c.title,
    c.content,
    c.metadata,
    c.status,
    c.sensitivity,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.dffe_knowledge_chunks c
  WHERE
    c.sensitivity = ANY(allowed_sensitivities)
    AND (filter_collection = 'all' OR c.collection_id = filter_collection)
    AND (filter_status = 'all' OR LOWER(c.status) = LOWER(filter_status))
    AND (c.embedding IS NULL OR (1 - (c.embedding <=> query_embedding)) >= match_threshold)
  ORDER BY
    CASE WHEN c.embedding IS NOT NULL THEN (c.embedding <=> query_embedding) ELSE 1.0 END ASC
  LIMIT match_count;
END;
$$;
