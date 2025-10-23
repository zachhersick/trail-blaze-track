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
      achievements: {
        Row: {
          category: string
          created_at: string
          criteria: Json
          description: string
          icon: string
          id: string
          name: string
          points: number
        }
        Insert: {
          category: string
          created_at?: string
          criteria: Json
          description: string
          icon: string
          id?: string
          name: string
          points?: number
        }
        Update: {
          category?: string
          created_at?: string
          criteria?: Json
          description?: string
          icon?: string
          id?: string
          name?: string
          points?: number
        }
        Relationships: []
      }
      activities: {
        Row: {
          average_speed_mps: number
          created_at: string
          elevation_gain_m: number
          elevation_loss_m: number
          end_time: string
          id: string
          max_altitude_m: number | null
          max_speed_mps: number
          min_altitude_m: number | null
          moving_time_s: number
          sport_type: Database["public"]["Enums"]["sport_type"]
          start_time: string
          total_distance_m: number
          total_time_s: number
          user_id: string
          vertical_drop_m: number
        }
        Insert: {
          average_speed_mps?: number
          created_at?: string
          elevation_gain_m?: number
          elevation_loss_m?: number
          end_time: string
          id?: string
          max_altitude_m?: number | null
          max_speed_mps?: number
          min_altitude_m?: number | null
          moving_time_s?: number
          sport_type: Database["public"]["Enums"]["sport_type"]
          start_time: string
          total_distance_m?: number
          total_time_s?: number
          user_id: string
          vertical_drop_m?: number
        }
        Update: {
          average_speed_mps?: number
          created_at?: string
          elevation_gain_m?: number
          elevation_loss_m?: number
          end_time?: string
          id?: string
          max_altitude_m?: number | null
          max_speed_mps?: number
          min_altitude_m?: number | null
          moving_time_s?: number
          sport_type?: Database["public"]["Enums"]["sport_type"]
          start_time?: string
          total_distance_m?: number
          total_time_s?: number
          user_id?: string
          vertical_drop_m?: number
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          activity_id: string
          created_at: string
          ended_at: string | null
          id: string
          is_active: boolean
          share_code: string
          user_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          share_code: string
          user_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          share_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          default_sport: Database["public"]["Enums"]["sport_type"] | null
          display_name: string | null
          id: string
          unit_preference: Database["public"]["Enums"]["unit_preference"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_sport?: Database["public"]["Enums"]["sport_type"] | null
          display_name?: string | null
          id: string
          unit_preference?:
            | Database["public"]["Enums"]["unit_preference"]
            | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_sport?: Database["public"]["Enums"]["sport_type"] | null
          display_name?: string | null
          id?: string
          unit_preference?:
            | Database["public"]["Enums"]["unit_preference"]
            | null
          updated_at?: string
        }
        Relationships: []
      }
      trackpoints: {
        Row: {
          activity_id: string
          altitude_m: number | null
          created_at: string
          id: string
          latitude: number
          longitude: number
          recorded_at: string
          speed_mps: number | null
        }
        Insert: {
          activity_id: string
          altitude_m?: number | null
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          recorded_at: string
          speed_mps?: number | null
        }
        Update: {
          activity_id?: string
          altitude_m?: number | null
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          recorded_at?: string
          speed_mps?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trackpoints_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          activity_id: string | null
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          activity_id?: string | null
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          activity_id?: string | null
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_achievements: {
        Args: { p_activity_id: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      sport_type: "ski" | "bike" | "offroad" | "hike"
      unit_preference: "metric" | "imperial"
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
      sport_type: ["ski", "bike", "offroad", "hike"],
      unit_preference: ["metric", "imperial"],
    },
  },
} as const
