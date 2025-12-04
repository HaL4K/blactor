export interface User {
  id: number;
  email: string;
  username: string;
  password: string;
  created_at: Date;
}

export interface SessionUser {
  id: number;
  email: string;
  username: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ChatMessage {
  id: number;
  sender_id: number;
  receiver_id: number | null;
  room_id: number | null;
  content: string;
  created_at: Date;
}

export interface ChatRoom {
  id: number;
  name: string;
  is_private: boolean;
  created_at: Date;
}
export interface Friend {
  id: number;
  user_id: number;
  friend_id: number;
  status: "pending" | "accepted" | "rejected" | "blocked";
  created_at: Date;
  updated_at: Date;
  friend_username?: string;
  friend_email?: string;
}

export interface PrivateChat {
  id: number;
  user1_id: number;
  user2_id: number;
  created_at: Date;
  last_message_at: Date;
  other_user?: {
    id: number;
    username: string;
    email: string;
  };
  last_message?: string;
  unread_count?: number;
}

export interface PrivateMessage {
  id: number;
  chat_id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read: boolean;
  is_delivered: boolean;
  created_at: Date;
  sender_username?: string;
  receiver_username?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: "friend_request" | "message" | "system";
  message: string;
  related_id: number | null;
  is_read: boolean;
  created_at: Date;
}
