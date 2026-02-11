-- ============================================================
-- Myan-Seg-Editor: Supabase Database Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'Untitled Project',
    description TEXT,
    total_lines INTEGER NOT NULL DEFAULT 0,
    reviewed_lines INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    granularity_config JSONB DEFAULT '{}',
    segmentation_method TEXT NOT NULL DEFAULT 'local' CHECK (segmentation_method IN ('local', 'ml')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Document lines table
CREATE TABLE IF NOT EXISTS document_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    original_text TEXT NOT NULL,
    segments JSONB NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'conflict')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(project_id, line_number)
);

-- 3. Glossary entries table
CREATE TABLE IF NOT EXISTS glossary_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word TEXT NOT NULL,
    segments JSONB NOT NULL DEFAULT '[]',
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'auto')),
    count INTEGER NOT NULL DEFAULT 1,
    is_ambiguous BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(word, source)
);

-- 4. Segment patterns table (learned word→segments mappings)
CREATE TABLE IF NOT EXISTS segment_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern TEXT NOT NULL UNIQUE,
    segmentation JSONB NOT NULL DEFAULT '[]',
    frequency INTEGER NOT NULL DEFAULT 1,
    last_seen_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_document_lines_project ON document_lines(project_id);
CREATE INDEX IF NOT EXISTS idx_document_lines_project_line ON document_lines(project_id, line_number);
CREATE INDEX IF NOT EXISTS idx_glossary_word ON glossary_entries(word);
CREATE INDEX IF NOT EXISTS idx_segment_patterns_pattern ON segment_patterns(pattern);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- ============================================================
-- Automatic updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_lines_updated_at
    BEFORE UPDATE ON document_lines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_glossary_entries_updated_at
    BEFORE UPDATE ON glossary_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_segment_patterns_updated_at
    BEFORE UPDATE ON segment_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security (permissive for now — no auth)
-- ============================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE glossary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_patterns ENABLE ROW LEVEL SECURITY;

-- Allow all operations via anon key (Phase 1: no auth)
CREATE POLICY "Allow all for anon" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON document_lines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON glossary_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON segment_patterns FOR ALL USING (true) WITH CHECK (true);
