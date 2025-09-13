export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          subscription_tier: 'free' | 'pro' | 'enterprise'
          autumn_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          autumn_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          autumn_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      videos: {
        Row: {
          id: string
          user_id: string
          filename: string
          url: string | null
          file_size: number | null
          duration_seconds: number | null
          status: 'pending' | 'processing' | 'completed' | 'failed'
          accuracy_level: 'nano' | 'mini' | 'full'
          search_prompt: string
          frame_interval: number
          progress: number
          error_message: string | null
          created_at: string
          updated_at: string
          processed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          filename: string
          url?: string | null
          file_size?: number | null
          duration_seconds?: number | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          accuracy_level: 'nano' | 'mini' | 'full'
          search_prompt: string
          frame_interval?: number
          progress?: number
          error_message?: string | null
          created_at?: string
          updated_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          filename?: string
          url?: string | null
          file_size?: number | null
          duration_seconds?: number | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          accuracy_level?: 'nano' | 'mini' | 'full'
          search_prompt?: string
          frame_interval?: number
          progress?: number
          error_message?: string | null
          created_at?: string
          updated_at?: string
          processed_at?: string | null
        }
      }
      video_analysis: {
        Row: {
          id: string
          video_id: string
          timestamp: number
          frame_number: number
          analysis_result: Json
          tokens_used: number | null
          created_at: string
        }
        Insert: {
          id?: string
          video_id: string
          timestamp: number
          frame_number: number
          analysis_result: Json
          tokens_used?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          timestamp?: number
          frame_number?: number
          analysis_result?: Json
          tokens_used?: number | null
          created_at?: string
        }
      }
      search_results: {
        Row: {
          id: string
          video_id: string
          query: string
          timestamps: Json
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          video_id: string
          query: string
          timestamps: Json
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          query?: string
          timestamps?: Json
          created_at?: string
          expires_at?: string
        }
      }
      processing_queue: {
        Row: {
          id: string
          video_id: string
          priority: number
          attempts: number
          last_attempt_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          video_id: string
          priority?: number
          attempts?: number
          last_attempt_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          priority?: number
          attempts?: number
          last_attempt_at?: string | null
          created_at?: string
        }
      }
    }
  }
}