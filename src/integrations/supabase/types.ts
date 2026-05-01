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
      application_subjects: {
        Row: {
          application_id: string
          subject_id: string
        }
        Insert: {
          application_id: string
          subject_id: string
        }
        Update: {
          application_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_subjects_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          address: string | null
          application_number: string
          created_at: string
          exam_id: string
          id: string
          passport_scan_path: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          phone: string | null
          photo_path: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["application_status"]
          target_university: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          application_number: string
          created_at?: string
          exam_id: string
          id?: string
          passport_scan_path?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          phone?: string | null
          photo_path?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          target_university?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          application_number?: string
          created_at?: string
          exam_id?: string
          id?: string
          passport_scan_path?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          phone?: string | null
          photo_path?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          target_university?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          available_seats: number
          created_at: string
          description: string | null
          exam_date: string
          id: string
          is_active: boolean
          location: string
          name: string
          registration_end: string
          registration_start: string
          session: Database["public"]["Enums"]["exam_session"]
          total_seats: number
          updated_at: string
          year: number
        }
        Insert: {
          available_seats: number
          created_at?: string
          description?: string | null
          exam_date: string
          id?: string
          is_active?: boolean
          location: string
          name: string
          registration_end: string
          registration_start: string
          session: Database["public"]["Enums"]["exam_session"]
          total_seats: number
          updated_at?: string
          year: number
        }
        Update: {
          available_seats?: number
          created_at?: string
          description?: string | null
          exam_date?: string
          id?: string
          is_active?: boolean
          location?: string
          name?: string
          registration_end?: string
          registration_start?: string
          session?: Database["public"]["Enums"]["exam_session"]
          total_seats?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          passport_number: string
          phone: string | null
          profile_photo_path: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email: string
          first_name: string
          id: string
          is_active?: boolean
          last_name: string
          passport_number: string
          phone?: string | null
          profile_photo_path?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          passport_number?: string
          phone?: string | null
          profile_photo_path?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          category: Database["public"]["Enums"]["subject_category"]
          code: string
          created_at: string
          id: string
          name_ja: string
          name_mn: string
        }
        Insert: {
          category: Database["public"]["Enums"]["subject_category"]
          code: string
          created_at?: string
          id?: string
          name_ja: string
          name_mn: string
        }
        Update: {
          category?: Database["public"]["Enums"]["subject_category"]
          code?: string
          created_at?: string
          id?: string
          name_ja?: string
          name_mn?: string
        }
        Relationships: []
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      promote_to_admin: { Args: { _email: string }; Returns: string }
    }
    Enums: {
      app_role: "student" | "admin"
      application_status: "pending" | "approved" | "rejected"
      exam_session: "first" | "second"
      payment_status: "unpaid" | "paid"
      subject_category: "japanese" | "math" | "science" | "general"
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
      app_role: ["student", "admin"],
      application_status: ["pending", "approved", "rejected"],
      exam_session: ["first", "second"],
      payment_status: ["unpaid", "paid"],
      subject_category: ["japanese", "math", "science", "general"],
    },
  },
} as const
