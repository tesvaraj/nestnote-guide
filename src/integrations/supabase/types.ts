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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          additional_info: string | null
          adults_independent_care: boolean | null
          age: string | null
          children_under_five: boolean | null
          created_at: string | null
          custody_requires_housing: boolean | null
          disabilities: string | null
          disability_details: string | null
          education: string | null
          eviction_past_seven_years: boolean | null
          foster_care_after_16: boolean | null
          has_children: boolean | null
          has_custody: boolean | null
          has_housing_voucher: boolean | null
          has_trusted_contacts: boolean | null
          health_concerns: string | null
          health_details: string | null
          homeless_over_year: boolean | null
          household_disability: boolean | null
          household_pregnant: boolean | null
          housing_accommodations: string[] | null
          housing_application_opt_in: boolean | null
          housing_search_type: string | null
          housing_situation: string | null
          id: string
          immediate_needs: string[] | null
          immigration_status_prevented_housing: boolean | null
          justice_system_prevented_housing: boolean | null
          mental_health_crisis: boolean | null
          monthly_income: string | null
          name: string
          physical_health_crisis: boolean | null
          poor_credit_prevented_housing: boolean | null
          sex_offender_registry: boolean | null
          single_parent_household: boolean | null
          updated_at: string | null
          user_id: string
          violence_trauma: boolean | null
          where_sleep_frequently: string | null
        }
        Insert: {
          additional_info?: string | null
          adults_independent_care?: boolean | null
          age?: string | null
          children_under_five?: boolean | null
          created_at?: string | null
          custody_requires_housing?: boolean | null
          disabilities?: string | null
          disability_details?: string | null
          education?: string | null
          eviction_past_seven_years?: boolean | null
          foster_care_after_16?: boolean | null
          has_children?: boolean | null
          has_custody?: boolean | null
          has_housing_voucher?: boolean | null
          has_trusted_contacts?: boolean | null
          health_concerns?: string | null
          health_details?: string | null
          homeless_over_year?: boolean | null
          household_disability?: boolean | null
          household_pregnant?: boolean | null
          housing_accommodations?: string[] | null
          housing_application_opt_in?: boolean | null
          housing_search_type?: string | null
          housing_situation?: string | null
          id?: string
          immediate_needs?: string[] | null
          immigration_status_prevented_housing?: boolean | null
          justice_system_prevented_housing?: boolean | null
          mental_health_crisis?: boolean | null
          monthly_income?: string | null
          name: string
          physical_health_crisis?: boolean | null
          poor_credit_prevented_housing?: boolean | null
          sex_offender_registry?: boolean | null
          single_parent_household?: boolean | null
          updated_at?: string | null
          user_id: string
          violence_trauma?: boolean | null
          where_sleep_frequently?: string | null
        }
        Update: {
          additional_info?: string | null
          adults_independent_care?: boolean | null
          age?: string | null
          children_under_five?: boolean | null
          created_at?: string | null
          custody_requires_housing?: boolean | null
          disabilities?: string | null
          disability_details?: string | null
          education?: string | null
          eviction_past_seven_years?: boolean | null
          foster_care_after_16?: boolean | null
          has_children?: boolean | null
          has_custody?: boolean | null
          has_housing_voucher?: boolean | null
          has_trusted_contacts?: boolean | null
          health_concerns?: string | null
          health_details?: string | null
          homeless_over_year?: boolean | null
          household_disability?: boolean | null
          household_pregnant?: boolean | null
          housing_accommodations?: string[] | null
          housing_application_opt_in?: boolean | null
          housing_search_type?: string | null
          housing_situation?: string | null
          id?: string
          immediate_needs?: string[] | null
          immigration_status_prevented_housing?: boolean | null
          justice_system_prevented_housing?: boolean | null
          mental_health_crisis?: boolean | null
          monthly_income?: string | null
          name?: string
          physical_health_crisis?: boolean | null
          poor_credit_prevented_housing?: boolean | null
          sex_offender_registry?: boolean | null
          single_parent_household?: boolean | null
          updated_at?: string | null
          user_id?: string
          violence_trauma?: boolean | null
          where_sleep_frequently?: string | null
        }
        Relationships: []
      }
      resource_feedback: {
        Row: {
          created_at: string
          feedback_data: Json
          id: string
          resource_id: string
          resource_name: string
        }
        Insert: {
          created_at?: string
          feedback_data: Json
          id?: string
          resource_id: string
          resource_name: string
        }
        Update: {
          created_at?: string
          feedback_data?: Json
          id?: string
          resource_id?: string
          resource_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
