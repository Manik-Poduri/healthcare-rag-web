import { createClient } from '@supabase/supabase-js';

// Client-side / general use: respects Row Level Security policies
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Server-side only: bypasses Row Level Security, uses the service_role key.
// NEVER import this into any client-side ("use client") component.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);