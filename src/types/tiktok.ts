export interface TikTokAuthState {
  accessToken: string | null;
  advertiserId: string | null;
  isAuthenticated: boolean;
}

export type CampaignObjective = "Traffic" | "Conversions";

export type MusicOption = "existing" | "upload" | "none";

export interface AdCreationForm {
  campaignName: string;
  objective: CampaignObjective;
  adText: string;
  cta: string;
  musicOption: MusicOption;
  musicId?: string;
}

export interface TikTokApiError {
  code: string;
  message: string;
  status?: number;
}
