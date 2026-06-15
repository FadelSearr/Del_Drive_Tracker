import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// TODO: Anda perlu mengganti ini dengan URL dan Anon Key dari project Supabase Anda
const supabaseUrl = 'https://flzjkloysupuorwpgbxg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsemprbG95c3VwdW9yd3BnYnhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MzYzMDIsImV4cCI6MjA5NzAxMjMwMn0.bExxeWYuI-3SC8irT-s1J7CwvAmVS4ypUHXEy_-CWYo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
