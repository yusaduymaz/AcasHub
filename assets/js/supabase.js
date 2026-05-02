/**
 * supabase.js — Supabase Client Configuration
 * 
 * Single source of truth for Supabase connection.
 * All other modules import from here.
 * 
 * Usage:
 *   const client = window.AcasHub.supabase;
 *   const { data } = await client.from('services').select('*');
 */

(function () {
    'use strict';

    // ─── Configuration ──────────────────────────────────────────────
    const SUPABASE_URL = 'NULL';
    const SUPABASE_ANON_KEY = 'NULL';

    // ─── Initialize Client ──────────────────────────────────────────
    if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
        console.error(
            '[AcasHub] supabase-js library not loaded.\n' +
            'Make sure the Supabase CDN script is included before supabase.js in your HTML.'
        );
        return;
    }

    const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // ─── Expose via namespace ───────────────────────────────────────
    window.AcasHub = window.AcasHub || {};
    window.AcasHub.supabase = client;
    window.AcasHub.config = {
        SUPABASE_URL,
        isConfigured: true,
    };

    console.log('[AcasHub] Supabase client initialized ✓');
})();
