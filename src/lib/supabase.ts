import { createClient } from '@supabase/supabase-js';

const meta = import.meta as any;
const supabaseUrl = (meta.env && meta.env.VITE_SUPABASE_URL) || 'https://ydlzvuutjgelpxueufgn.supabase.co';
const supabaseAnonKey = (meta.env && meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) || 'sb_publishable_KoXiLZfD6mIYGRRMb0gjtg_h3PkBle7';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
