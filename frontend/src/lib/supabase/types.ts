export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      abuse_reports: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string
          deleted_at: string | null
          description: string
          handled_at: string | null
          id: string
          reported_user_id: string | null
          reporter_id: string
          session_id: string | null
          status: string
          updated_at: string
          version: number
        }
        Insert: {
          admin_notes?: string | null
          category: string
          created_at?: string
          deleted_at?: string | null
          description: string
          handled_at?: string | null
          id?: string
          reported_user_id?: string | null
          reporter_id: string
          session_id?: string | null
          status: string
          updated_at?: string
          version?: number
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          deleted_at?: string | null
          description?: string
          handled_at?: string | null
          id?: string
          reported_user_id?: string | null
          reporter_id?: string
          session_id?: string | null
          status?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_abuse_reports_reported_user"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_abuse_reports_reporter"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_abuse_reports_session"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          latitude: number | null
          location_type: number | null
          longitude: number | null
          name: string
          postal_code: string | null
          state: string | null
          updated_at: string
          version: number
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          latitude?: number | null
          location_type?: number | null
          longitude?: number | null
          name: string
          postal_code?: string | null
          state?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          latitude?: number | null
          location_type?: number | null
          longitude?: number | null
          name?: string
          postal_code?: string | null
          state?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      schedule_preference_focus: {
        Row: {
          focus_area: string | null
          preference_id: string
        }
        Insert: {
          focus_area?: string | null
          preference_id: string
        }
        Update: {
          focus_area?: string | null
          preference_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sched_pref_focus_preference"
            columns: ["preference_id"]
            isOneToOne: false
            referencedRelation: "schedule_preferences"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_preference_levels: {
        Row: {
          level: string | null
          preference_id: string
        }
        Insert: {
          level?: string | null
          preference_id: string
        }
        Update: {
          level?: string | null
          preference_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sched_pref_levels_preference"
            columns: ["preference_id"]
            isOneToOne: false
            referencedRelation: "schedule_preferences"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_preference_locations: {
        Row: {
          location_id: string
          preference_id: string
        }
        Insert: {
          location_id: string
          preference_id: string
        }
        Update: {
          location_id?: string
          preference_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sched_pref_locations_location"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sched_pref_locations_preference"
            columns: ["preference_id"]
            isOneToOne: false
            referencedRelation: "schedule_preferences"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_preference_roles: {
        Row: {
          preference_id: string
          role: string | null
        }
        Insert: {
          preference_id: string
          role?: string | null
        }
        Update: {
          preference_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sched_pref_roles_preference"
            columns: ["preference_id"]
            isOneToOne: false
            referencedRelation: "schedule_preferences"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_preference_windows: {
        Row: {
          day_of_week: string
          end_time: string
          id: string
          preference_id: string
          recurring: boolean
          specific_date: string | null
          start_time: string
        }
        Insert: {
          day_of_week: string
          end_time: string
          id?: string
          preference_id: string
          recurring?: boolean
          specific_date?: string | null
          start_time: string
        }
        Update: {
          day_of_week?: string
          end_time?: string
          id?: string
          preference_id?: string
          recurring?: boolean
          specific_date?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sched_pref_windows_preference"
            columns: ["preference_id"]
            isOneToOne: false
            referencedRelation: "schedule_preferences"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_preferences: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          location_note: string | null
          max_travel_distance_km: number | null
          notes: string | null
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          location_note?: string | null
          max_travel_distance_km?: number | null
          notes?: string | null
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          location_note?: string | null
          max_travel_distance_km?: number | null
          notes?: string | null
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_schedule_preferences_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      session_focus_areas: {
        Row: {
          focus_area: string | null
          session_id: string
        }
        Insert: {
          focus_area?: string | null
          session_id: string
        }
        Update: {
          focus_area?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_session_focus_areas_session"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_invites: {
        Row: {
          created_at: string
          deleted_at: string | null
          expires_at: string | null
          id: string
          invitee_id: string
          note: string | null
          proposer_id: string
          session_id: string
          status: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          invitee_id: string
          note?: string | null
          proposer_id: string
          session_id: string
          status?: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          invitee_id?: string
          note?: string | null
          proposer_id?: string
          session_id?: string
          status?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "session_invites_invitee_id_fkey"
            columns: ["invitee_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_invites_proposer_id_fkey"
            columns: ["proposer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_invites_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_note_media: {
        Row: {
          media_url: string | null
          note_id: string
        }
        Insert: {
          media_url?: string | null
          note_id: string
        }
        Update: {
          media_url?: string | null
          note_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_session_note_media_note"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "session_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      session_note_tags: {
        Row: {
          note_id: string
          tag: string | null
        }
        Insert: {
          note_id: string
          tag?: string | null
        }
        Update: {
          note_id?: string
          tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_session_note_tags_note"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "session_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      session_notes: {
        Row: {
          author_id: string
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          session_id: string
          updated_at: string
          version: number
          visibility: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          session_id: string
          updated_at?: string
          version?: number
          visibility: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          session_id?: string
          updated_at?: string
          version?: number
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_session_notes_author"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_session_notes_session"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_participants: {
        Row: {
          session_id: string
          user_id: string
        }
        Insert: {
          session_id: string
          user_id: string
        }
        Update: {
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_session_participants_session"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_session_participants_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          capacity: number | null
          created_at: string
          deleted_at: string | null
          id: string
          location_id: string | null
          organizer_id: string
          scheduled_end: string
          scheduled_start: string
          session_type: string
          status: string
          title: string
          updated_at: string
          version: number
          visibility: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          location_id?: string | null
          organizer_id: string
          scheduled_end: string
          scheduled_start: string
          session_type: string
          status: string
          title: string
          updated_at?: string
          version?: number
          visibility: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          location_id?: string | null
          organizer_id?: string
          scheduled_end?: string
          scheduled_start?: string
          session_type?: string
          status?: string
          title?: string
          updated_at?: string
          version?: number
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sessions_location"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sessions_organizer"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_user_id: string
          user_id: string
        }
        Insert: {
          blocked_user_id: string
          user_id: string
        }
        Update: {
          blocked_user_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_blocks_blocked_user"
            columns: ["blocked_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_blocks_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_channels: {
        Row: {
          channel: string | null
          user_id: string
        }
        Insert: {
          channel?: string | null
          user_id: string
        }
        Update: {
          channel?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_notification_channels_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          account_status: number
          auth_user_id: string
          bio: string | null
          birth_date: string | null
          competitiveness_level: number
          created_at: string
          dance_goals: string | null
          deleted_at: string | null
          display_name: string | null
          email: string
          first_name: string
          home_location_id: string | null
          id: string
          last_name: string
          primary_role: number
          profile_visible: boolean
          updated_at: string
          version: number
          wsdc_level: number | null
        }
        Insert: {
          account_status: number
          auth_user_id: string
          bio?: string | null
          birth_date?: string | null
          competitiveness_level: number
          created_at?: string
          dance_goals?: string | null
          deleted_at?: string | null
          display_name?: string | null
          email: string
          first_name: string
          home_location_id?: string | null
          id?: string
          last_name: string
          primary_role: number
          profile_visible: boolean
          updated_at?: string
          version?: number
          wsdc_level?: number | null
        }
        Update: {
          account_status?: number
          auth_user_id?: string
          bio?: string | null
          birth_date?: string | null
          competitiveness_level?: number
          created_at?: string
          dance_goals?: string | null
          deleted_at?: string | null
          display_name?: string | null
          email?: string
          first_name?: string
          home_location_id?: string | null
          id?: string
          last_name?: string
          primary_role?: number
          profile_visible?: boolean
          updated_at?: string
          version?: number
          wsdc_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_profiles_home_location"
            columns: ["home_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          role: string
          user_id: string
        }
        Insert: {
          role: string
          user_id: string
        }
        Update: {
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_roles_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: {
        Args: { lookup_invitation_token: string }
        Returns: Json
      }
      create_account: { Args: { name?: string; slug?: string }; Returns: Json }
      create_invitation: {
        Args: {
          account_id: string
          account_role: "owner" | "member"
          invitation_type: "one_time" | "24_hour"
        }
        Returns: Json
      }
      current_profile_id: { Args: never; Returns: string }
      current_user_account_role: { Args: { account_id: string }; Returns: Json }
      current_user_is_admin: { Args: never; Returns: boolean }
      delete_invitation: { Args: { invitation_id: string }; Returns: undefined }
      find_matches_for_current_user: {
        Args: { p_limit?: number }
        Returns: {
          candidate_preference_id: string
          candidate_profile_id: string
          overlapping_minutes: number
          overlapping_windows: number
          score: number
          shared_focus_areas: number
          wsdc_level_diff: number
        }[]
      }
      get_account: { Args: { account_id: string }; Returns: Json }
      get_account_billing_status: {
        Args: { account_id: string }
        Returns: Json
      }
      get_account_by_slug: { Args: { slug: string }; Returns: Json }
      get_account_id: { Args: { slug: string }; Returns: string }
      get_account_invitations: {
        Args: {
          account_id: string
          results_limit?: number
          results_offset?: number
        }
        Returns: Json
      }
      get_account_members: {
        Args: {
          account_id: string
          results_limit?: number
          results_offset?: number
        }
        Returns: Json
      }
      get_accounts: { Args: never; Returns: Json }
      get_personal_account: { Args: never; Returns: Json }
      is_session_organizer: { Args: { session_id: string }; Returns: boolean }
      is_session_participant: { Args: { session_id: string }; Returns: boolean }
      lookup_invitation: {
        Args: { lookup_invitation_token: string }
        Returns: Json
      }
      preference_owned_by_current: {
        Args: { pref_id: string }
        Returns: boolean
      }
      propose_practice_session: {
        Args: {
          p_end: string
          p_invitee_id: string
          p_location_id?: string
          p_note?: string
          p_start: string
        }
        Returns: {
          invite_id: string
          invite_status: string
          session_id: string
        }[]
      }
      remove_account_member: {
        Args: { account_id: string; user_id: string }
        Returns: undefined
      }
      respond_to_session_invite: {
        Args: { p_action: string; p_invite_id: string }
        Returns: {
          invite_id: string
          invite_status: string
          session_id: string
        }[]
      }
      service_role_upsert_customer_subscription: {
        Args: { account_id: string; customer?: Json; subscription?: Json }
        Returns: undefined
      }
      session_note_owned: { Args: { note_id: string }; Returns: boolean }
      suggest_overlapping_windows: {
        Args: { p_invitee_id: string }
        Returns: {
          day_of_week: string
          end_time: string
          overlap_minutes: number
          start_time: string
        }[]
      }
      update_account: {
        Args: {
          account_id: string
          name?: string
          public_metadata?: Json
          replace_metadata?: boolean
          slug?: string
        }
        Returns: Json
      }
      update_account_user_role: {
        Args: {
          account_id: string
          make_primary_owner?: boolean
          new_account_role: "owner" | "member"
          user_id: string
        }
        Returns: undefined
      }
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

