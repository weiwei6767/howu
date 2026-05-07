export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      couples: {
        Row: {
          disconnected_at: string | null
          id: string
          paired_at: string | null
          partner_a_id: string | null
          partner_b_id: string | null
          paused_at: string | null
          recovery_until: string | null
          relationship_type: string | null
          status: string | null
          together_since: string
        }
        Insert: {
          disconnected_at?: string | null
          id?: string
          paired_at?: string | null
          partner_a_id?: string | null
          partner_b_id?: string | null
          paused_at?: string | null
          recovery_until?: string | null
          relationship_type?: string | null
          status?: string | null
          together_since: string
        }
        Update: {
          disconnected_at?: string | null
          id?: string
          paired_at?: string | null
          partner_a_id?: string | null
          partner_b_id?: string | null
          paused_at?: string | null
          recovery_until?: string | null
          relationship_type?: string | null
          status?: string | null
          together_since?: string
        }
        Relationships: [
          {
            foreignKeyName: "couples_partner_a_id_fkey"
            columns: ["partner_a_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couples_partner_b_id_fkey"
            columns: ["partner_b_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_responses: {
        Row: {
          completed_at: string | null
          couple_id: string | null
          date: string
          energy: number | null
          happiness: number | null
          id: string
          miss_partner: number | null
          mood_tags: string[] | null
          responder_id: string | null
          rotating_answers: Json
          secret_archived: boolean | null
          secret_delivery_at: string | null
          secret_delivery_mode: string | null
          secret_message: string | null
          secret_read_at: string | null
          stress: number | null
          us_overall: number | null
        }
        Insert: {
          completed_at?: string | null
          couple_id?: string | null
          date: string
          energy?: number | null
          happiness?: number | null
          id?: string
          miss_partner?: number | null
          mood_tags?: string[] | null
          responder_id?: string | null
          rotating_answers?: Json
          secret_archived?: boolean | null
          secret_delivery_at?: string | null
          secret_delivery_mode?: string | null
          secret_message?: string | null
          secret_read_at?: string | null
          stress?: number | null
          us_overall?: number | null
        }
        Update: {
          completed_at?: string | null
          couple_id?: string | null
          date?: string
          energy?: number | null
          happiness?: number | null
          id?: string
          miss_partner?: number | null
          mood_tags?: string[] | null
          responder_id?: string | null
          rotating_answers?: Json
          secret_archived?: boolean | null
          secret_delivery_at?: string | null
          secret_delivery_mode?: string | null
          secret_message?: string | null
          secret_read_at?: string | null
          stress?: number | null
          us_overall?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_responses_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_responses_responder_id_fkey"
            columns: ["responder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      four_grid_responses: {
        Row: {
          couple_id: string | null
          created_at: string | null
          custom_photo_category: string | null
          custom_photo_url: string | null
          date: string
          id: string
          responder_id: string | null
          selected_index: number | null
          theme: string
        }
        Insert: {
          couple_id?: string | null
          created_at?: string | null
          custom_photo_category?: string | null
          custom_photo_url?: string | null
          date: string
          id?: string
          responder_id?: string | null
          selected_index?: number | null
          theme: string
        }
        Update: {
          couple_id?: string | null
          created_at?: string | null
          custom_photo_category?: string | null
          custom_photo_url?: string | null
          date?: string
          id?: string
          responder_id?: string | null
          selected_index?: number | null
          theme?: string
        }
        Relationships: [
          {
            foreignKeyName: "four_grid_responses_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "four_grid_responses_responder_id_fkey"
            columns: ["responder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_by_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          inviter_id: string | null
          message: string | null
          message_style: string | null
          status: string | null
          token: string
        }
        Insert: {
          accepted_by_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          inviter_id?: string | null
          message?: string | null
          message_style?: string | null
          status?: string | null
          token: string
        }
        Update: {
          accepted_by_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          inviter_id?: string | null
          message?: string | null
          message_style?: string | null
          status?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_accepted_by_id_fkey"
            columns: ["accepted_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          attached_response_id: string | null
          content: string | null
          created_at: string | null
          date: string
          id: string
          shared_with_partner: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          attached_response_id?: string | null
          content?: string | null
          created_at?: string | null
          date: string
          id?: string
          shared_with_partner?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          attached_response_id?: string | null
          content?: string | null
          created_at?: string | null
          date?: string
          id?: string
          shared_with_partner?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_attached_response_id_fkey"
            columns: ["attached_response_id"]
            isOneToOne: false
            referencedRelation: "daily_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          couple_id: string | null
          created_at: string | null
          date: string
          id: string
          recurring: boolean | null
          title: string
          type: string | null
        }
        Insert: {
          couple_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          recurring?: boolean | null
          title: string
          type?: string | null
        }
        Update: {
          couple_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          recurring?: boolean | null
          title?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestones_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          couple_id: string | null
          created_at: string | null
          expedited: boolean | null
          id: string
          items: Json
          shipping_address: Json | null
          status: string | null
          total_twd: number
          tracking_number: string | null
          user_id: string | null
        }
        Insert: {
          couple_id?: string | null
          created_at?: string | null
          expedited?: boolean | null
          id?: string
          items: Json
          shipping_address?: Json | null
          status?: string | null
          total_twd: number
          tracking_number?: string | null
          user_id?: string | null
        }
        Update: {
          couple_id?: string | null
          created_at?: string | null
          expedited?: boolean | null
          id?: string
          items?: Json
          shipping_address?: Json | null
          status?: string | null
          total_twd?: number
          tracking_number?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birthday: string | null
          created_at: string | null
          display_name: string
          emoji_pack: Json | null
          id: string
          is_premium: boolean | null
          locale: string | null
          premium_expires_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string | null
          display_name: string
          emoji_pack?: Json | null
          id: string
          is_premium?: boolean | null
          locale?: string | null
          premium_expires_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string | null
          display_name?: string
          emoji_pack?: Json | null
          id?: string
          is_premium?: boolean | null
          locale?: string | null
          premium_expires_at?: string | null
        }
        Relationships: []
      }
      promises: {
        Row: {
          couple_id: string | null
          created_at: string | null
          enabled: boolean | null
          id: string
          text_zh: string
        }
        Insert: {
          couple_id?: string | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          text_zh: string
        }
        Update: {
          couple_id?: string | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          text_zh?: string
        }
        Relationships: [
          {
            foreignKeyName: "promises_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          keys: Json
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          keys: Json
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          keys?: Json
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      question_packs: {
        Row: {
          cover_url: string | null
          created_at: string | null
          creator_id: string | null
          description_zh: string | null
          id: string
          is_premium_included: boolean | null
          name_en: string | null
          name_zh: string
          price_twd: number | null
          published_at: string | null
          type: string | null
        }
        Insert: {
          cover_url?: string | null
          created_at?: string | null
          creator_id?: string | null
          description_zh?: string | null
          id?: string
          is_premium_included?: boolean | null
          name_en?: string | null
          name_zh: string
          price_twd?: number | null
          published_at?: string | null
          type?: string | null
        }
        Update: {
          cover_url?: string | null
          created_at?: string | null
          creator_id?: string | null
          description_zh?: string | null
          id?: string
          is_premium_included?: boolean | null
          name_en?: string | null
          name_zh?: string
          price_twd?: number | null
          published_at?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_packs_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          category: string
          for_relationship_types: string[] | null
          id: string
          is_premium: boolean | null
          options_en: Json | null
          options_zh: Json | null
          pack_id: string | null
          text_en: string
          text_zh: string
          type: string
          weight: number | null
        }
        Insert: {
          category: string
          for_relationship_types?: string[] | null
          id: string
          is_premium?: boolean | null
          options_en?: Json | null
          options_zh?: Json | null
          pack_id?: string | null
          text_en: string
          text_zh: string
          type: string
          weight?: number | null
        }
        Update: {
          category?: string
          for_relationship_types?: string[] | null
          id?: string
          is_premium?: boolean | null
          options_en?: Json | null
          options_zh?: Json | null
          pack_id?: string | null
          text_en?: string
          text_zh?: string
          type?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "question_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_photos: {
        Row: {
          caption: string | null
          couple_id: string | null
          created_at: string | null
          id: string
          taken_at: string | null
          uploader_id: string | null
          url: string
        }
        Insert: {
          caption?: string | null
          couple_id?: string | null
          created_at?: string | null
          id?: string
          taken_at?: string | null
          uploader_id?: string | null
          url: string
        }
        Update: {
          caption?: string | null
          couple_id?: string | null
          created_at?: string | null
          id?: string
          taken_at?: string | null
          uploader_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_photos_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_photos_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount_twd: number | null
          cancelled_at: string | null
          created_at: string | null
          current_period_end: string | null
          id: string
          plan: string | null
          provider: string | null
          provider_subscription_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount_twd?: number | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan?: string | null
          provider?: string | null
          provider_subscription_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount_twd?: number | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan?: string | null
          provider?: string | null
          provider_subscription_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_score_events: {
        Row: {
          couple_id: string | null
          created_at: string | null
          date: string
          delta: number
          id: string
          source: string
          source_detail: Json | null
        }
        Insert: {
          couple_id?: string | null
          created_at?: string | null
          date: string
          delta: number
          id?: string
          source: string
          source_detail?: Json | null
        }
        Update: {
          couple_id?: string | null
          created_at?: string | null
          date?: string
          delta?: number
          id?: string
          source?: string
          source_detail?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_score_events_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_scores: {
        Row: {
          cooled_down: boolean | null
          couple_id: string
          last_calculated_at: string | null
          level: number | null
          total_score: number | null
        }
        Insert: {
          cooled_down?: boolean | null
          couple_id: string
          last_calculated_at?: string | null
          level?: number | null
          total_score?: number | null
        }
        Update: {
          cooled_down?: boolean | null
          couple_id?: string
          last_calculated_at?: string | null
          level?: number | null
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_scores_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: true
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_couple_member: { Args: { cid: string }; Returns: boolean }
      is_partner_of: { Args: { other_uid: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
