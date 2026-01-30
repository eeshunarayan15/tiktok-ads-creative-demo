// src/types/tiktok.ts

// Define ErrorType FIRST
export type ErrorType =
    | "NETWORK_ERROR"
    | "OAUTH_INVALID_CREDENTIALS"
    | "OAUTH_EXPIRED_TOKEN"
    | "OAUTH_MISSING_PERMISSIONS"
    | "OAUTH_GEO_RESTRICTION"
    | "RATE_LIMIT"
    | "MUSIC_INVALID_ID"
    | "MUSIC_NOT_AVAILABLE"
    | "UNKNOWN_ERROR";

export interface UserFriendlyError {
  type: ErrorType;
  title: string;
  message: string;
  action: string;
  canRetry: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  data?: {
    error_code?: string;
    description?: string;
  };
}

export type CampaignObjective = "TRAFFIC" | "CONVERSIONS";
export type MusicOption = "existing" | "upload" | "none";

// ✅ AdFormData defined ONCE with all properties
export interface AdFormData {
  campaignName: string;
  objective: CampaignObjective;
  adText: string;
  cta: string;
  musicOption: MusicOption;
  musicId?: string;
  uploadedMusicFile?: File | null; // Add this
}

export interface FormErrors {
  campaignName?: string;
  objective?: string;
  adText?: string;
  cta?: string;
  musicOption?: string;
  musicId?: string;
  uploadedMusicFile?: string; // Add this if used
}

export interface OAuthTokens {
  accessToken: string;      // Also needed: access_token for API compatibility
  refreshToken?: string;
  expires_in: number;       // Add this (seconds until expiration)
  timestamp: number;        // Add this (when token was received)
  advertiser_id?: string;
}

export interface AdCreationResponse {
  success: boolean;
  ad_id?: string;
  error?: ApiError;
}

export interface MusicValidationResponse {
  valid: boolean;
  music_id: string;
  title?: string;
  artist?: string;
  error?: string;
}

// ✅ TikTokAuthState defined ONCE
export interface TikTokAuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  advertiserId: string | null;
  user?: TikTokUser | null;
  loading?: boolean;
  error?: string | null;
}

export interface TikTokUser {
  advertiser_id: string;
  advertiser_name: string;
}