import { createClient } from '@supabase/supabase-js';

// Твой URL и анонимный Ключ берутся в настройках Supabase (Project Settings -> API)
const supabaseUrl = 'https://oumrejgrixqfmohzxles.supabase.co';
const supabaseAnonKey = 'sb_publishable_LAjTa0kW2whGNSUV8tRdbg_qmS6k4hw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);