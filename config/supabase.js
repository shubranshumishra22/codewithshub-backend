import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

const supabaseOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
};

export const supabase = createClient(
  env.supabaseUrl,
  env.supabasePublishableKey,
  supabaseOptions,
);

export const supabaseAdmin = env.supabaseServiceRoleKey
  ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey, supabaseOptions)
  : null;

export const createSupabaseForToken = (accessToken) =>
  createClient(env.supabaseUrl, env.supabasePublishableKey, {
    ...supabaseOptions,
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
