import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}
