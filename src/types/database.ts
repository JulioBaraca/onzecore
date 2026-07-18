/**
 * Placeholder until real types are generated with:
 *   supabase gen types typescript --project-id ygsjqipbuwlodwylymgo > src/types/database.ts
 * (requires Supabase CLI login - tracked as a Phase 5 follow-up).
 */
export type Database = {
  public: {
    Tables: Record<
      string,
      {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      }
    >;
    Views: Record<string, { Row: Record<string, unknown> }>;
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
    Enums: Record<string, string>;
  };
};
