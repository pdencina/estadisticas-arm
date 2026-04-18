import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cookieStore.set({ name, value, ...options } as any);
          } catch { /* ignorar en Server Components */ }
        },
        remove(name: string, options: Record<string, unknown>) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cookieStore.set({ name, value: "", ...options } as any);
          } catch { /* ignorar en Server Components */ }
        },
      },
    }
  );
}
