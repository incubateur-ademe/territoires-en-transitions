/**
 * Derives the Supabase auth cookie name from the project URL.
 * Matches the format used by @supabase/ssr: sb-${projectRef}-auth-token
 */
export function supabaseUrlToAuthCookieName(supabaseUrl: string): string {
  const hostname = new URL(supabaseUrl).hostname;
  const projectRef = hostname.split('.')[0];
  return `sb-${projectRef}-auth-token`;
}
