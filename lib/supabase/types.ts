// Supabase 自動生成型別佔位。
// migration 上 Supabase 後執行:
//   npx supabase gen types typescript --project-id <PROJECT_ID> --schema public > lib/supabase/types.ts
// 即可覆蓋本檔。

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
