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
      addresses: {
        Row: {
          address: string
          created_at: string | null
          id: string
          municipality: string
          phone: string
          province: string
          recipient_name: string
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string | null
          id?: string
          municipality: string
          phone: string
          province: string
          recipient_name: string
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string | null
          id?: string
          municipality?: string
          phone?: string
          province?: string
          recipient_name?: string
          user_id?: string
        }
        Relationships: []
      }
      debug_logs: {
        Row: {
          id: string
          message: string | null
          method: string | null
          path: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          message?: string | null
          method?: string | null
          path?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          message?: string | null
          method?: string | null
          path?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      delivery_meals: {
        Row: {
          completed_at: string | null
          created_at: string | null
          delivery_id: string | null
          id: string
          meal_id: string
          notes: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          delivery_id?: string | null
          id?: string
          meal_id: string
          notes?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          delivery_id?: string | null
          id?: string
          meal_id?: string
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_meals_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "order_deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_meals_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          active: boolean | null
          allergens: string[]
          chef_note: string | null
          created_at: string | null
          description: string
          id: string
          image_url: string
          ingredients: string[]
          name: string
          times_ordered: number
        }
        Insert: {
          active?: boolean | null
          allergens?: string[]
          chef_note?: string | null
          created_at?: string | null
          description: string
          id: string
          image_url: string
          ingredients?: string[]
          name: string
          times_ordered?: number
        }
        Update: {
          active?: boolean | null
          allergens?: string[]
          chef_note?: string | null
          created_at?: string | null
          description?: string
          id?: string
          image_url?: string
          ingredients?: string[]
          name?: string
          times_ordered?: number
        }
        Relationships: []
      }
      order_deliveries: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          id: string
          meals_count: number
          notes: string | null
          order_id: string | null
          scheduled_date: string
          status: string
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          meals_count?: number
          notes?: string | null
          order_id?: string | null
          scheduled_date: string
          status?: string
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          meals_count?: number
          notes?: string | null
          order_id?: string | null
          scheduled_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          delivery_address_data: Json
          delivery_address_id: string
          id: string
          meals: Json[]
          package_data: Json
          package_id: string
          personal_note: string | null
          status: string
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          delivery_address_data: Json
          delivery_address_id: string
          id?: string
          meals: Json[]
          package_data: Json
          package_id: string
          personal_note?: string | null
          status?: string
          total: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          delivery_address_data?: Json
          delivery_address_id?: string
          id?: string
          meals?: Json[]
          package_data?: Json
          package_id?: string
          personal_note?: string | null
          status?: string
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_orders: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          currency: string
          description: string | null
          error_message: string | null
          id: string
          order_id: string
          payment_method: string
          reference: string | null
          short_url: string | null
          status: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string
          description?: string | null
          error_message?: string | null
          id?: string
          order_id: string
          payment_method: string
          reference?: string | null
          short_url?: string | null
          status?: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string
          description?: string | null
          error_message?: string | null
          id?: string
          order_id?: string
          payment_method?: string
          reference?: string | null
          short_url?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      http_request_log: {
        Args: {
          message: string
          method?: string
          path?: string
        }
        Returns: undefined
      }
      insert_delivery: {
        Args: {
          p_order_id: string
          p_scheduled_date: string
          p_meals_count: number
          p_delivery_meals: Json
        }
        Returns: undefined
      }
      is_admin:
        | {
            Args: Record<PropertyKey, never>
            Returns: boolean
          }
        | {
            Args: {
              user_uid: string
            }
            Returns: boolean
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
