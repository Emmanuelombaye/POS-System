import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://glskbegsmdrylrhczpyy.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_waCCK6KyQPWQlCQHpzVucQ_5ytpKQcQ';

export const supabase = createClient(supabaseUrl, supabaseKey);
