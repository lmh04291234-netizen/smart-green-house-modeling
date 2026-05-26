import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl?.includes("example.supabase.co") &&
  supabaseAnonKey !== "local-preview-key";

export const supabase = createClient(
  supabaseUrl ?? "https://example.supabase.co",
  supabaseAnonKey ?? "local-preview-key"
);

export type Assignment = {
  id: string;
  title: string;
  description: string;
  service_url: string;
  owner_id: string;
  owner_email: string | null;
  created_at: string;
  updated_at: string;
};

export type AssignmentInput = {
  title: string;
  description: string;
  service_url: string;
};
