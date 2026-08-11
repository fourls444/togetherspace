export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type RoomType = "friend" | "couple" | "family";
export type RoomRole = "owner" | "member";
export type BoardType = "main" | "notes" | "checklist" | "poll" | "custom";
export type BoardItemType = "note" | "checklist" | "poll";

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
      room_profiles: {
        Row: {
          room_id: string;
          user_id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          room_id: string;
          user_id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
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
      boards: {
        Row: {
          id: string;
          room_id: string;
          name: string;
          board_type: BoardType;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          name?: string;
          board_type?: BoardType;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          board_type?: BoardType;
          updated_at?: string;
        };
        Relationships: [];
      };
      board_items: {
        Row: {
          id: string;
          board_id: string;
          item_type: BoardItemType;
          title: string;
          body: string | null;
          position_x: number;
          position_y: number;
          width: number;
          height: number;
          z_index: number;
          color: string | null;
          poll_max_votes_per_user: number;
          poll_allow_vote_cancel: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          board_id: string;
          item_type: BoardItemType;
          title: string;
          body?: string | null;
          position_x?: number;
          position_y?: number;
          width?: number;
          height?: number;
          z_index?: number;
          color?: string | null;
          poll_max_votes_per_user?: number;
          poll_allow_vote_cancel?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: {
          title?: string;
          body?: string | null;
          position_x?: number;
          position_y?: number;
          width?: number;
          height?: number;
          z_index?: number;
          color?: string | null;
          poll_max_votes_per_user?: number;
          poll_allow_vote_cancel?: boolean;
          updated_at?: string;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      board_checklist_items: {
        Row: {
          id: string;
          board_item_id: string;
          text: string;
          is_done: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          board_item_id: string;
          text: string;
          is_done?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          text?: string;
          is_done?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      board_poll_options: {
        Row: {
          id: string;
          board_item_id: string;
          label: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          board_item_id: string;
          label: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          label?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      board_poll_votes: {
        Row: {
          option_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          option_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      calendar_events: {
        Row: {
          id: string;
          room_id: string;
          title: string;
          description: string | null;
          event_date: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          title: string;
          description?: string | null;
          event_date: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          event_date?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      room_places: {
        Row: {
          id: string;
          room_id: string;
          name: string;
          description: string | null;
          latitude: number;
          longitude: number;
          place_date: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          name: string;
          description?: string | null;
          latitude: number;
          longitude: number;
          place_date?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          latitude?: number;
          longitude?: number;
          place_date?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      album_photos: {
        Row: {
          id: string;
          room_id: string;
          uploaded_by: string;
          image_url: string;
          storage_path: string;
          caption: string | null;
          taken_at: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          uploaded_by: string;
          image_url: string;
          storage_path: string;
          caption?: string | null;
          taken_at?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          image_url?: string;
          storage_path?: string;
          caption?: string | null;
          taken_at?: string;
          sort_order?: number;
          updated_at?: string;
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
      ensure_room_board: {
        Args: {
          p_room_id: string;
        };
        Returns: string;
      };
      preview_room_invite: {
        Args: {
          p_invite_token: string;
        };
        Returns: {
          room_id: string;
          room_name: string;
          room_type: RoomType;
          room_avatar_url: string | null;
          member_count: number;
          is_already_member: boolean;
        }[];
      };
      update_profile: {
        Args: {
          p_display_name?: string | null;
          p_avatar_url?: string | null;
          p_username?: string | null;
        };
        Returns: void;
      };
      update_room_profile: {
        Args: {
          p_room_id: string;
          p_display_name?: string | null;
          p_avatar_url?: string | null;
        };
        Returns: void;
      };
    };
    Enums: {
      room_type: RoomType;
      room_role: RoomRole;
      board_type: BoardType;
      board_item_type: BoardItemType;
    };
    CompositeTypes: Record<string, never>;
  };
};
