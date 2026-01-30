// OAuth Config
export const OAUTH_CONFIG = {
  clientKey: import.meta.env.VITE_TIKTOK_APP_ID || "",
  authUrl: "https://ads.tiktok.com/marketing_api/auth",
  tokenUrl: "https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token",
  scopes: ["user.info.basic", "video.list", "ad_management"],
  redirectUri: import.meta.env.VITE_REDIRECT_URI || "http://localhost:5173/auth/callback",
};

// API
export const API_ENDPOINTS = {
  validateMusic: "/music/validate",
  createAd: "/ad/create",
  getAdvertiser: "/advertiser/info",
};

// Mock Data
export const MOCK_MUSIC_IDS = ["1234567890123456", "9876543210987654"];

// Form Options
export const CTA_OPTIONS = [
  { value: "LEARN_MORE", label: "Learn More" },
  { value: "SHOP_NOW", label: "Shop Now" },
  { value: "SIGN_UP", label: "Sign Up" },
  { value: "DOWNLOAD", label: "Download" },
];

export const OBJECTIVE_OPTIONS = [
  { value: "TRAFFIC", label: "Traffic", description: "Drive traffic to your website" },
  { value: "CONVERSIONS", label: "Conversions", description: "Get more sales or sign-ups" },
];

export const MUSIC_OPTIONS = [
  { value: "existing", label: "Use Existing Music ID", description: "Enter a music ID from TikTok's library" },
  { value: "upload", label: "Upload Custom Music", description: "Upload your own audio file" },
  { value: "none", label: "No Music", description: "Create ad without background music" },
];

// Validation
export const VALIDATION_RULES = {
  campaignName: { minLength: 3, maxLength: 100 },
  adText: { maxLength: 100 },
};

export const VALIDATION_ERRORS = {
  campaignName: {
    required: "Campaign name is required",
    minLength: "Campaign name must be at least 3 characters",
  },
  objective: { required: "Please select a campaign objective" },
  adText: { required: "Ad text is required", maxLength: "Max 100 characters" },
  cta: { required: "Please select a call-to-action" },
  musicOption: { required: "Please select a music option", invalidForObjective: "Music required for Conversions" },
  musicId: { required: "Music ID is required" },
  uploadedMusicFile: { required: "Please upload a music file" },
};

// Error Codes
export const ERROR_CODES = {
  INVALID_CLIENT: "invalid_client",
  INVALID_GRANT: "invalid_grant",
  EXPIRED_TOKEN: "expired_token",
  UNAUTHORIZED_CLIENT: "unauthorized_client",
  INSUFFICIENT_PERMISSIONS: "insufficient_permissions",
  GEO_RESTRICTED: "geo_restricted",
  RATE_LIMIT_EXCEEDED: "rate_limit_exceeded",
  INVALID_MUSIC_ID: "invalid_music_id",
  MUSIC_NOT_AVAILABLE: "music_not_available",
} as const;