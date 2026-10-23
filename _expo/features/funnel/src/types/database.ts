export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type EmptySchema = { [_ in never]: never };

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          onboarding_complete: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          onboarding_complete?: boolean;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          onboarding_complete?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      onboarding_responses: {
        Row: { id: string; user_id: string; payload: Json; created_at: string };
        Insert: { id?: string; user_id: string; payload?: Json; created_at?: string };
        Update: { payload?: Json };
        Relationships: [];
      };
      app_records: {
        Row: {
          id: string;
          user_id: string;
          kind: string;
          payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind?: string;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: { kind?: string; payload?: Json; updated_at?: string };
        Relationships: [];
      };
    };
    Views: EmptySchema;
    Functions: { delete_current_user: { Args: Record<PropertyKey, never>; Returns: undefined } };
    Enums: EmptySchema;
    CompositeTypes: EmptySchema;
  };
};
