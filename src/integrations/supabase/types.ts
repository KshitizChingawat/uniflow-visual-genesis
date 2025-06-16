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
      clipboard_sync: {
        Row: {
          content: string
          content_type: string
          created_at: string
          device_id: string
          encrypted_content: string | null
          id: string
          sync_timestamp: string
          synced_to_devices: string[] | null
          user_id: string
        }
        Insert: {
          content: string
          content_type?: string
          created_at?: string
          device_id: string
          encrypted_content?: string | null
          id?: string
          sync_timestamp?: string
          synced_to_devices?: string[] | null
          user_id: string
        }
        Update: {
          content?: string
          content_type?: string
          created_at?: string
          device_id?: string
          encrypted_content?: string | null
          id?: string
          sync_timestamp?: string
          synced_to_devices?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clipboard_sync_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          created_at: string
          device_id: string
          device_name: string
          device_type: string
          id: string
          is_active: boolean | null
          last_seen: string | null
          platform: string
          public_key: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          device_name: string
          device_type: string
          id?: string
          is_active?: boolean | null
          last_seen?: string | null
          platform: string
          public_key?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          device_name?: string
          device_type?: string
          id?: string
          is_active?: boolean | null
          last_seen?: string | null
          platform?: string
          public_key?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      file_transfers: {
        Row: {
          completed_at: string | null
          created_at: string
          encrypted_metadata: Json | null
          file_hash: string | null
          file_name: string
          file_size: number
          file_type: string | null
          id: string
          receiver_device_id: string | null
          sender_device_id: string
          transfer_method: string
          transfer_status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          encrypted_metadata?: Json | null
          file_hash?: string | null
          file_name: string
          file_size: number
          file_type?: string | null
          id?: string
          receiver_device_id?: string | null
          sender_device_id: string
          transfer_method?: string
          transfer_status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          encrypted_metadata?: Json | null
          file_hash?: string | null
          file_name?: string
          file_size?: number
          file_type?: string | null
          id?: string
          receiver_device_id?: string | null
          sender_device_id?: string
          transfer_method?: string
          transfer_status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_transfers_receiver_device_id_fkey"
            columns: ["receiver_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_transfers_sender_device_id_fkey"
            columns: ["sender_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          app_name: string | null
          body: string | null
          created_at: string
          id: string
          is_mirrored: boolean | null
          notification_type: string | null
          source_device_id: string
          target_devices: string[] | null
          title: string
          user_id: string
        }
        Insert: {
          app_name?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_mirrored?: boolean | null
          notification_type?: string | null
          source_device_id: string
          target_devices?: string[] | null
          title: string
          user_id: string
        }
        Update: {
          app_name?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_mirrored?: boolean | null
          notification_type?: string | null
          source_device_id?: string
          target_devices?: string[] | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_source_device_id_fkey"
            columns: ["source_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      secure_vault: {
        Row: {
          accessed_at: string | null
          created_at: string
          encrypted_content: string
          id: string
          item_type: string
          metadata: Json | null
          tags: string[] | null
          user_id: string
        }
        Insert: {
          accessed_at?: string | null
          created_at?: string
          encrypted_content: string
          id?: string
          item_type: string
          metadata?: Json | null
          tags?: string[] | null
          user_id: string
        }
        Update: {
          accessed_at?: string | null
          created_at?: string
          encrypted_content?: string
          id?: string
          item_type?: string
          metadata?: Json | null
          tags?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      usage_analytics: {
        Row: {
          action_type: string
          created_at: string
          device_id: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          device_id: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          device_id?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_analytics_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
