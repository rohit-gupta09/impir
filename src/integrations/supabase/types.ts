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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          reference_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          reference_id?: string | null
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          reference_id?: string | null
          type?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          saved_for_later: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          saved_for_later?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          saved_for_later?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          display_order: number | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      catalog_main_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      catalog_subcategories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          legacy_category_name: string | null
          main_category_id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          legacy_category_name?: string | null
          main_category_id: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          legacy_category_name?: string | null
          main_category_id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_subcategories_main_category_id_fkey"
            columns: ["main_category_id"]
            isOneToOne: false
            referencedRelation: "catalog_main_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          banner_image_url: string | null
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          banner_image_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          banner_image_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      business_account_memberships: {
        Row: {
          business_account_id: string
          created_at: string
          id: string
          is_primary: boolean
          role: string
          user_id: string
        }
        Insert: {
          business_account_id: string
          created_at?: string
          id?: string
          is_primary?: boolean
          role?: string
          user_id: string
        }
        Update: {
          business_account_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_account_memberships_business_account_id_fkey"
            columns: ["business_account_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      business_accounts: {
        Row: {
          billing_address: Json
          contact_email: string
          contact_phone: string
          created_at: string
          created_by: string | null
          credit_limit: number
          customer_type: string
          display_name: string
          gstin: string | null
          id: string
          legal_name: string
          payment_terms: string
          updated_at: string
        }
        Insert: {
          billing_address?: Json
          contact_email?: string
          contact_phone?: string
          created_at?: string
          created_by?: string | null
          credit_limit?: number
          customer_type?: string
          display_name: string
          gstin?: string | null
          id?: string
          legal_name: string
          payment_terms?: string
          updated_at?: string
        }
        Update: {
          billing_address?: Json
          contact_email?: string
          contact_phone?: string
          created_at?: string
          created_by?: string | null
          credit_limit?: number
          customer_type?: string
          display_name?: string
          gstin?: string | null
          id?: string
          legal_name?: string
          payment_terms?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          assigned_hub_id: string | null
          created_at: string
          customer_city: string | null
          customer_pincode: string | null
          delivery_address: Json | null
          delivery_promise_text: string | null
          id: string
          promised_service_level: string | null
          products: Json
          quote_id: string
          quote_number: string
          routing_type: string | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_hub_id?: string | null
          created_at?: string
          customer_city?: string | null
          customer_pincode?: string | null
          delivery_address?: Json | null
          delivery_promise_text?: string | null
          id?: string
          promised_service_level?: string | null
          products?: Json
          quote_id: string
          quote_number: string
          routing_type?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_hub_id?: string | null
          created_at?: string
          customer_city?: string | null
          customer_pincode?: string | null
          delivery_address?: Json | null
          delivery_promise_text?: string | null
          id?: string
          promised_service_level?: string | null
          products?: Json
          quote_id?: string
          quote_number?: string
          routing_type?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          company_id: string | null
          company_name: string
          created_at: string
          description: string
          id: string
          image_source: string
          image_url: string | null
          is_new: boolean | null
          is_popular: boolean | null
          main_category_id: string | null
          name: string
          sku: string
          subcategory_id: string | null
          unit: string
        }
        Insert: {
          category: string
          company_id?: string | null
          company_name?: string
          created_at?: string
          description?: string
          id?: string
          image_source?: string
          image_url?: string | null
          is_new?: boolean | null
          is_popular?: boolean | null
          main_category_id?: string | null
          name: string
          sku: string
          subcategory_id?: string | null
          unit?: string
        }
        Update: {
          category?: string
          company_id?: string | null
          company_name?: string
          created_at?: string
          description?: string
          id?: string
          image_source?: string
          image_url?: string | null
          is_new?: boolean | null
          is_popular?: boolean | null
          main_category_id?: string | null
          name?: string
          sku?: string
          subcategory_id?: string | null
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_main_category_id_fkey"
            columns: ["main_category_id"]
            isOneToOne: false
            referencedRelation: "catalog_main_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "catalog_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_account_id: string | null
          company_name: string | null
          created_at: string
          designation: string | null
          email: string | null
          full_name: string
          id: string
          phone: string | null
          preferred_city: string | null
          preferred_pincode: string | null
          updated_at: string
          user_id: string
          whatsapp_opt_in: boolean
        }
        Insert: {
          avatar_url?: string | null
          business_account_id?: string | null
          company_name?: string | null
          created_at?: string
          designation?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          preferred_city?: string | null
          preferred_pincode?: string | null
          updated_at?: string
          user_id: string
          whatsapp_opt_in?: boolean
        }
        Update: {
          avatar_url?: string | null
          business_account_id?: string | null
          company_name?: string | null
          created_at?: string
          designation?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          preferred_city?: string | null
          preferred_pincode?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_opt_in?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "profiles_business_account_id_fkey"
            columns: ["business_account_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_banners: {
        Row: {
          created_at: string
          cta_label: string | null
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          link_type: string
          link_value: string | null
          position: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_label?: string | null
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean
          link_type?: string
          link_value?: string | null
          position?: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_label?: string | null
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          link_type?: string
          link_value?: string | null
          position?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      supplier_product_prices: {
        Row: {
          created_at: string
          id: string
          is_preferred: boolean
          lead_time_days: number
          location_name: string
          min_order_quantity: number
          notes: string | null
          price: number
          product_id: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_preferred?: boolean
          lead_time_days?: number
          location_name: string
          min_order_quantity?: number
          notes?: string | null
          price: number
          product_id: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_preferred?: boolean
          lead_time_days?: number
          location_name?: string
          min_order_quantity?: number
          notes?: string | null
          price?: number
          product_id?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_product_prices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          admin_response: string | null
          billing_address: Json
          business_account_id: string | null
          business_name: string | null
          contact_method: string | null
          created_at: string
          delivery_address: Json | null
          id: string
          payment_terms: string | null
          products: Json
          project_description: string | null
          project_type: string
          quote_number: string
          requested_by_email: string | null
          requested_by_name: string | null
          requested_by_phone: string | null
          routing_summary: Json
          status: string
          timeline: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          billing_address?: Json
          business_account_id?: string | null
          business_name?: string | null
          contact_method?: string | null
          created_at?: string
          delivery_address?: Json | null
          id?: string
          payment_terms?: string | null
          products?: Json
          project_description?: string | null
          project_type?: string
          quote_number: string
          requested_by_email?: string | null
          requested_by_name?: string | null
          requested_by_phone?: string | null
          routing_summary?: Json
          status?: string
          timeline?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          billing_address?: Json
          business_account_id?: string | null
          business_name?: string | null
          contact_method?: string | null
          created_at?: string
          delivery_address?: Json | null
          id?: string
          payment_terms?: string | null
          products?: Json
          project_description?: string | null
          project_type?: string
          quote_number?: string
          requested_by_email?: string | null
          requested_by_name?: string | null
          requested_by_phone?: string | null
          routing_summary?: Json
          status?: string
          timeline?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_business_account_id_fkey"
            columns: ["business_account_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          created_at: string
          id: string
          line_number: number
          line_total: number
          name: string
          notes: string | null
          product_id: string | null
          quantity: number
          quote_id: string
          sku: string | null
          source: string
          tax_percent: number
          unit: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          line_number: number
          line_total?: number
          name: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          quote_id: string
          sku?: string | null
          source?: string
          tax_percent?: number
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          line_number?: number
          line_total?: number
          name?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          quote_id?: string
          sku?: string | null
          source?: string
          tax_percent?: number
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_versions: {
        Row: {
          admin_response: string | null
          created_at: string
          created_by: string | null
          discount_amount: number
          freight_amount: number
          id: string
          items: Json
          payment_terms: string
          quote_id: string
          reason: string
          source: string
          status: string
          subtotal: number
          tax_amount: number
          total_amount: number
          validity_days: number
          version_number: number
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          freight_amount?: number
          id?: string
          items?: Json
          payment_terms?: string
          quote_id: string
          reason?: string
          source?: string
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          validity_days?: number
          version_number: number
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          freight_amount?: number
          id?: string
          items?: Json
          payment_terms?: string
          quote_id?: string
          reason?: string
          source?: string
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          validity_days?: number
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_versions_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_addresses: {
        Row: {
          address_line1: string
          city: string
          created_at: string
          id: string
          is_default: boolean | null
          label: string | null
          pincode: string
          state: string
          user_id: string
        }
        Insert: {
          address_line1: string
          city: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          pincode: string
          state: string
          user_id: string
        }
        Update: {
          address_line1?: string
          city?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          pincode?: string
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_quote_version_from_quote: {
        Args: {
          _created_by?: string
          _quote_id: string
          _reason?: string
          _source?: string
        }
        Returns: string
      }
      ensure_business_account: {
        Args: {
          _contact_email?: string
          _contact_phone?: string
          _created_by?: string
          _display_name: string
          _gstin?: string
          _legal_name?: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_belongs_to_business_account: {
        Args: {
          _business_account_id: string
          _user_id: string
        }
        Returns: boolean
      }
      user_can_manage_business_account: {
        Args: {
          _business_account_id: string
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "hub_manager" | "moderator" | "user"
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
      app_role: ["admin", "hub_manager", "moderator", "user"],
    },
  },
} as const
