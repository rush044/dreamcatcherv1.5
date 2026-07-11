import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

let supabase = null;

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn(
    "Supabase env vars missing. Check .env.local for VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY. App will keep running without Supabase."
  );
} else {
  supabase = createClient(supabaseUrl, supabasePublishableKey);
}

export { supabase };
