/**
 * Supabase Service Layer
 * 
 * Typed CRUD operations for projects, document lines, glossary, and segment patterns.
 * All operations are wrapped in try/catch — failures never crash the editor.
 */

import { getSupabase } from './supabase';
import { Line, Segment, GlossaryEntry, GlossarySource } from '../types';

// ─── Database row types ───────────────────────────────────────

export interface DBProject {
    id: string;
    name: string;
    description: string | null;
    total_lines: number;
    reviewed_lines: number;
    status: 'active' | 'completed' | 'archived';
    granularity_config: Record<string, unknown>;
    segmentation_method: 'local' | 'ml';
    created_at: string;
    updated_at: string;
}

export interface DBDocumentLine {
    id: string;
    project_id: string;
    line_number: number;
    original_text: string;
    segments: string[]; // JSONB: array of segment texts
    status: 'pending' | 'reviewed' | 'conflict';
    created_at: string;
    updated_at: string;
}

export interface DBGlossaryEntry {
    id: string;
    word: string;
    segments: string[];
    source: 'manual' | 'auto';
    count: number;
    is_ambiguous: boolean;
    created_at: string;
    updated_at: string;
}

export interface DBSegmentPattern {
    id: string;
    pattern: string;
    segmentation: string[];
    frequency: number;
    last_seen_project_id: string | null;
    created_at: string;
    updated_at: string;
}

// ─── Sync status tracking ─────────────────────────────────────

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

// ─── Projects ─────────────────────────────────────────────────

export async function createProject(
    name: string,
    totalLines: number,
    segmentationMethod: 'local' | 'ml' = 'local',
    description?: string
): Promise<DBProject | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from('projects')
            .insert({
                name,
                description: description || null,
                total_lines: totalLines,
                reviewed_lines: 0,
                status: 'active',
                segmentation_method: segmentationMethod,
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Failed to create project:', error.message);
            return null;
        }
        console.log('✅ Project created:', data.id);
        return data as DBProject;
    } catch (err) {
        console.error('❌ createProject exception:', err);
        return null;
    }
}

export async function updateProject(
    projectId: string,
    updates: Partial<Pick<DBProject, 'name' | 'description' | 'reviewed_lines' | 'status' | 'total_lines'>>
): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
        const { error } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', projectId);

        if (error) {
            console.error('❌ Failed to update project:', error.message);
            return false;
        }
        return true;
    } catch (err) {
        console.error('❌ updateProject exception:', err);
        return false;
    }
}

export async function listProjects(): Promise<DBProject[]> {
    const supabase = getSupabase();
    if (!supabase) return [];

    try {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('❌ Failed to list projects:', error.message);
            return [];
        }
        return (data || []) as DBProject[];
    } catch (err) {
        console.error('❌ listProjects exception:', err);
        return [];
    }
}

export async function loadProject(projectId: string): Promise<DBProject | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (error) {
            console.error('❌ Failed to load project:', error.message);
            return null;
        }
        return data as DBProject;
    } catch (err) {
        console.error('❌ loadProject exception:', err);
        return null;
    }
}

// ─── Document Lines ───────────────────────────────────────────

export async function saveDocumentLines(
    projectId: string,
    lines: Line[]
): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
        // Convert editor Line[] to DB format
        const rows = lines.map((line, index) => ({
            project_id: projectId,
            line_number: index + 1,
            original_text: line.originalText,
            segments: line.segments.map(s => s.text), // Store only text array
            status: line.status,
        }));

        // Upsert by project_id + line_number
        const { error } = await supabase
            .from('document_lines')
            .upsert(rows, { onConflict: 'project_id,line_number' });

        if (error) {
            console.error('❌ Failed to save lines:', error.message);
            return false;
        }
        console.log(`✅ Saved ${rows.length} lines to Supabase`);
        return true;
    } catch (err) {
        console.error('❌ saveDocumentLines exception:', err);
        return false;
    }
}

export async function loadDocumentLines(projectId: string): Promise<Line[] | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from('document_lines')
            .select('*')
            .eq('project_id', projectId)
            .order('line_number', { ascending: true });

        if (error) {
            console.error('❌ Failed to load lines:', error.message);
            return null;
        }

        if (!data || data.length === 0) return null;

        // Convert DB rows back to editor Line[]
        const lines: Line[] = data.map((row: DBDocumentLine) => ({
            id: row.line_number,
            originalText: row.original_text,
            segments: (row.segments as string[]).map((text, idx) => ({
                id: `line-${row.line_number}-seg-${idx}-db`,
                text,
                isActive: false,
            })) as Segment[],
            status: row.status as Line['status'],
        }));

        return lines;
    } catch (err) {
        console.error('❌ loadDocumentLines exception:', err);
        return null;
    }
}

// ─── Glossary ─────────────────────────────────────────────────

export async function syncGlossaryToSupabase(
    entries: GlossaryEntry[],
    source: GlossarySource
): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
        const rows = entries.map(entry => ({
            word: entry.word,
            segments: entry.segments,
            source,
            count: entry.count,
            is_ambiguous: entry.isAmbiguous,
        }));

        if (rows.length === 0) return true;

        const { error } = await supabase
            .from('glossary_entries')
            .upsert(rows, { onConflict: 'word,source' });

        if (error) {
            console.error('❌ Failed to sync glossary:', error.message);
            return false;
        }
        console.log(`✅ Synced ${rows.length} glossary entries (${source})`);
        return true;
    } catch (err) {
        console.error('❌ syncGlossary exception:', err);
        return false;
    }
}

export async function loadGlossaryFromSupabase(): Promise<{
    manual: GlossaryEntry[];
    auto: GlossaryEntry[];
} | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from('glossary_entries')
            .select('*')
            .order('count', { ascending: false });

        if (error) {
            console.error('❌ Failed to load glossary:', error.message);
            return null;
        }

        if (!data) return null;

        const manual: GlossaryEntry[] = [];
        const auto: GlossaryEntry[] = [];

        for (const row of data as DBGlossaryEntry[]) {
            const entry: GlossaryEntry = {
                word: row.word,
                segments: row.segments as string[],
                source: row.source as GlossarySource,
                count: row.count,
                addedAt: row.created_at,
                isAmbiguous: row.is_ambiguous,
            };

            if (row.source === 'manual') {
                manual.push(entry);
            } else {
                auto.push(entry);
            }
        }

        return { manual, auto };
    } catch (err) {
        console.error('❌ loadGlossary exception:', err);
        return null;
    }
}

// ─── Segment Patterns ─────────────────────────────────────────

export async function upsertSegmentPattern(
    pattern: string,
    segmentation: string[],
    projectId?: string
): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
        // Check if exists
        const { data: existing } = await supabase
            .from('segment_patterns')
            .select('id, frequency')
            .eq('pattern', pattern)
            .single();

        if (existing) {
            // Increment frequency
            const { error } = await supabase
                .from('segment_patterns')
                .update({
                    segmentation,
                    frequency: existing.frequency + 1,
                    last_seen_project_id: projectId || null,
                })
                .eq('id', existing.id);

            if (error) {
                console.error('❌ Failed to update pattern:', error.message);
                return false;
            }
        } else {
            // Insert new
            const { error } = await supabase
                .from('segment_patterns')
                .insert({
                    pattern,
                    segmentation,
                    frequency: 1,
                    last_seen_project_id: projectId || null,
                });

            if (error) {
                console.error('❌ Failed to insert pattern:', error.message);
                return false;
            }
        }
        return true;
    } catch (err) {
        console.error('❌ upsertSegmentPattern exception:', err);
        return false;
    }
}

export async function loadSegmentPatterns(minFrequency: number = 2): Promise<DBSegmentPattern[]> {
    const supabase = getSupabase();
    if (!supabase) return [];

    try {
        const { data, error } = await supabase
            .from('segment_patterns')
            .select('*')
            .gte('frequency', minFrequency)
            .order('frequency', { ascending: false });

        if (error) {
            console.error('❌ Failed to load patterns:', error.message);
            return [];
        }
        return (data || []) as DBSegmentPattern[];
    } catch (err) {
        console.error('❌ loadSegmentPatterns exception:', err);
        return [];
    }
}

// ─── Helpers ──────────────────────────────────────────────────

export async function getLastActiveProject(): Promise<DBProject | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('status', 'active')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error || !data) return null;
        return data as DBProject;
    } catch {
        return null;
    }
}
