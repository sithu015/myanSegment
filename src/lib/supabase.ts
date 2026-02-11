/**
 * Supabase Client Singleton
 * 
 * Uses NEXT_PUBLIC_ env vars for browser-side access.
 * Falls back gracefully if env vars are missing.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('⚠️ Supabase credentials not configured. Cloud sync disabled.');
        return null;
    }

    if (!supabase) {
        supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false },
        });
    }

    return supabase;
}

/**
 * Check if Supabase is available and connected.
 */
export async function isSupabaseConnected(): Promise<boolean> {
    const client = getSupabase();
    if (!client) return false;

    try {
        const { error } = await client.from('projects').select('id').limit(1);
        return !error;
    } catch {
        return false;
    }
}
