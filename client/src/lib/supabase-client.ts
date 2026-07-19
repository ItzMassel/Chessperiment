'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isConfigured = !!(supabaseUrl && supabaseAnonKey);

let supabaseClient: ReturnType<typeof createClient> | null = null;

if (isConfigured) {
  supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!);
}

export { supabaseClient as supabase };
