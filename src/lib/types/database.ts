export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type RoomType = "friend" | "couple" | "family";
export type RoomRole = "owner" | "member";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          username?: string;
          display_name?: string;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      rooms: {
        Row: {
          id: string;
          name: string;
          room_code: string;
          type: RoomType;
          avatar_url: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          room_code: string;
          type: RoomType;
          avatar_url?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          type?: RoomType;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      room_members: {
        Row: {
          room_id: string;
          user_id: string;
          role: RoomRole;
          joined_at: string;
          last_opened_at: string | null;
        };
        Insert: {
          room_id: string;
          user_id: string;
          role?: RoomRole;
          joined_at?: string;
          last_opened_at?: string | null;
        };
        Update: {
          role?: RoomRole;
          last_opened_at?: string | null;
        };
        Relationships: [];
      };
      room_invites: {
        Row: {
          id: string;
          room_id: string;
          invite_code: string;
          invite_token: string;
          created_by: string;
          expires_at: string | null;
          max_uses: number | null;
          uses_count: number;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          invite_code: string;
          invite_token: string;
          created_by: string;
          expires_at?: string | null;
          max_uses?: number | null;
          uses_count?: number;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: {
          expires_at?: string | null;
          max_uses?: number | null;
          uses_count?: number;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_room: {
        Args: {
          p_name: string;
          p_type: RoomType;
          p_avatar_url?: string | null;
        };
        Returns: string;
      };
      create_room_invite: {
        Args: {
          p_room_id: string;
          p_max_uses?: number | null;
          p_expires_at?: string | null;
        };
        Returns: {
          id: string;
          invite_code: string;
          invite_token: string;
        }[];
      };
      join_room_by_invite: {
        Args: {
          p_invite_token: string;
        };
        Returns: string;
      };
      join_room_by_code: {
        Args: {
          p_invite_code: string;
        };
        Returns: string;
      };
      kick_member: {
        Args: {
          p_room_id: string;
          p_user_id: string;
        };
        Returns: void;
      };
      change_member_role: {
        Args: {
          p_room_id: string;
          p_user_id: string;
          p_new_role: RoomRole;
        };
        Returns: void;
      };
      leave_room: {
        Args: {
          p_room_id: string;
        };
        Returns: void;
      };
      revoke_invite: {
        Args: {
          p_invite_id: string;
        };
        Returns: void;
      };
      update_profile: {
        Args: {
          p_display_name?: string | null;
          p_avatar_url?: string | null;
          p_username?: string | null;
        };
        Returns: void;
      };
    };
    Enums: {
      room_type: RoomType;
      room_role: RoomRole;
    };
    CompositeTypes: Record<string, never>;
  };
};
