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
      action_queue: {
        Row: {
          created_at: string
          due: string
          id: string
          kind: string
          semester: Database["public"]["Enums"]["semester"]
          student_id: string | null
          title: string
          updated_at: string
          urgent: boolean
        }
        Insert: {
          created_at?: string
          due: string
          id: string
          kind: string
          semester?: Database["public"]["Enums"]["semester"]
          student_id?: string | null
          title: string
          updated_at?: string
          urgent?: boolean
        }
        Update: {
          created_at?: string
          due?: string
          id?: string
          kind?: string
          semester?: Database["public"]["Enums"]["semester"]
          student_id?: string | null
          title?: string
          updated_at?: string
          urgent?: boolean
        }
        Relationships: []
      }
      iep_goals: {
        Row: {
          approval: string
          approved_at: string | null
          approved_by: string | null
          baseline: string
          created_at: string
          domain: string
          evidence_count: number
          id: string
          last_evidence: string | null
          learning_area: string
          learning_intention: string
          level: string
          review_due: string | null
          semester: Database["public"]["Enums"]["semester"]
          smart: string
          status: string
          student_id: string
          student_name: string
          success_criteria: Json
          updated_at: string
          vc_link: string | null
        }
        Insert: {
          approval?: string
          approved_at?: string | null
          approved_by?: string | null
          baseline: string
          created_at?: string
          domain: string
          evidence_count?: number
          id: string
          last_evidence?: string | null
          learning_area: string
          learning_intention: string
          level: string
          review_due?: string | null
          semester?: Database["public"]["Enums"]["semester"]
          smart: string
          status?: string
          student_id: string
          student_name: string
          success_criteria?: Json
          updated_at?: string
          vc_link?: string | null
        }
        Update: {
          approval?: string
          approved_at?: string | null
          approved_by?: string | null
          baseline?: string
          created_at?: string
          domain?: string
          evidence_count?: number
          id?: string
          last_evidence?: string | null
          learning_area?: string
          learning_intention?: string
          level?: string
          review_due?: string | null
          semester?: Database["public"]["Enums"]["semester"]
          smart?: string
          status?: string
          student_id?: string
          student_name?: string
          success_criteria?: Json
          updated_at?: string
          vc_link?: string | null
        }
        Relationships: []
      }
      iep_override_audit: {
        Row: {
          action: string
          active_semester: string | null
          actor_id: string
          created_at: string
          goal_id: string | null
          goal_semester: Database["public"]["Enums"]["semester"] | null
          id: string
          note_semester: Database["public"]["Enums"]["semester"] | null
          payload: Json
          reason: string
          student_id: string | null
        }
        Insert: {
          action: string
          active_semester?: string | null
          actor_id: string
          created_at?: string
          goal_id?: string | null
          goal_semester?: Database["public"]["Enums"]["semester"] | null
          id?: string
          note_semester?: Database["public"]["Enums"]["semester"] | null
          payload?: Json
          reason: string
          student_id?: string | null
        }
        Update: {
          action?: string
          active_semester?: string | null
          actor_id?: string
          created_at?: string
          goal_id?: string | null
          goal_semester?: Database["public"]["Enums"]["semester"] | null
          id?: string
          note_semester?: Database["public"]["Enums"]["semester"] | null
          payload?: Json
          reason?: string
          student_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_hue: number
          created_at: string
          display_name: string | null
          id: string
          primary_group: Database["public"]["Enums"]["role_group"]
          updated_at: string
        }
        Insert: {
          avatar_hue?: number
          created_at?: string
          display_name?: string | null
          id: string
          primary_group?: Database["public"]["Enums"]["role_group"]
          updated_at?: string
        }
        Update: {
          avatar_hue?: number
          created_at?: string
          display_name?: string | null
          id?: string
          primary_group?: Database["public"]["Enums"]["role_group"]
          updated_at?: string
        }
        Relationships: []
      }
      specialist_notes: {
        Row: {
          comment: string
          created_at: string
          goal_id: string
          id: string
          photo_hue: number | null
          semester: Database["public"]["Enums"]["semester"]
          specialist_name: string
          specialist_role: string
          student_id: string
          updated_at: string
        }
        Insert: {
          comment: string
          created_at?: string
          goal_id: string
          id?: string
          photo_hue?: number | null
          semester: Database["public"]["Enums"]["semester"]
          specialist_name: string
          specialist_role: string
          student_id: string
          updated_at?: string
        }
        Update: {
          comment?: string
          created_at?: string
          goal_id?: string
          id?: string
          photo_hue?: number | null
          semester?: Database["public"]["Enums"]["semester"]
          specialist_name?: string
          specialist_role?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_notes_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "iep_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_update_cross_check_status: {
        Args: {
          p_active_semester: string
          p_criterion_index: number
          p_goal_id: string
          p_reason: string
          p_status: string
        }
        Returns: Json
      }
      admin_upsert_specialist_note: {
        Args: {
          p_comment: string
          p_goal_id: string
          p_note_id: string
          p_photo_hue: number
          p_reason: string
          p_semester: Database["public"]["Enums"]["semester"]
          p_specialist_name: string
          p_specialist_role: string
          p_student_id: string
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      in_group: {
        Args: {
          _group: Database["public"]["Enums"]["role_group"]
          _user_id: string
        }
        Returns: boolean
      }
      update_cross_check_status: {
        Args: {
          p_active_semester: string
          p_criterion_index: number
          p_goal_id: string
          p_status: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "teacher"
        | "principal"
        | "assistant_principal"
        | "learning_specialist"
        | "leading_teacher"
        | "ot"
        | "slp"
        | "physio"
        | "aha"
        | "psychologist"
        | "behaviour_specialist"
        | "nurse"
        | "wellbeing_officer"
        | "attendance_officer"
        | "it_admin"
      role_group:
        | "teacher"
        | "leadership"
        | "allied_health"
        | "wellbeing"
        | "it"
      semester: "Semester 1 · 2026" | "Semester 2 · 2026"
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
    Enums: {
      app_role: [
        "admin",
        "teacher",
        "principal",
        "assistant_principal",
        "learning_specialist",
        "leading_teacher",
        "ot",
        "slp",
        "physio",
        "aha",
        "psychologist",
        "behaviour_specialist",
        "nurse",
        "wellbeing_officer",
        "attendance_officer",
        "it_admin",
      ],
      role_group: ["teacher", "leadership", "allied_health", "wellbeing", "it"],
      semester: ["Semester 1 · 2026", "Semester 2 · 2026"],
    },
  },
} as const
