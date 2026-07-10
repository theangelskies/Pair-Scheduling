import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

function createMissingConfigClient() {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      }),
      signInWithOAuth: async () => ({
        data: { provider: 'google', url: null },
        error: {
          name: 'SupabaseConfigError',
          message: 'Supabase is not configured for this environment.',
          status: 500,
        },
      }),
    },
  } as unknown as SupabaseClient
}

export const supabase =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey)
    : createMissingConfigClient()
