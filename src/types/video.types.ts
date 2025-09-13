export type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type AccuracyLevel = 'nano' | 'mini' | 'full';
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface Video {
  id: string;
  filename: string;
  url: string | null;
  status: VideoStatus;
  accuracyLevel: AccuracyLevel;
  searchPrompt: string;
  frameInterval: number;
  progress: number;
  durationSeconds: number | null;
  fileSize: number | null;
  createdAt: string;
  updatedAt: string;
  processedAt: string | null;
  errorMessage: string | null;
}

export interface VideoAnalysis {
  id: string;
  videoId: string;
  timestamp: number;
  frameNumber: number;
  analysisResult: any;
  tokensUsed: number | null;
  createdAt: string;
}

export interface SearchResult {
  id: string;
  videoId: string;
  query: string;
  timestamps: number[];
  createdAt: string;
}

export interface ProcessingQueueItem {
  id: string;
  videoId: string;
  video?: Video;
  priority: number;
  attempts: number;
  position?: number;
  estimatedTime?: string;
}