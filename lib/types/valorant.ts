export interface ValorantSettings {
  valorant_name: string;
  valorant_tag: string;
  valorant_region: string;
  valorant_api_key: string;
  valorant_session_reset_at: string;
  
  // Toggles
  valorant_show_badge: string;
  valorant_show_rank: string;
  valorant_show_rr: string;
  valorant_show_wl: string;
  valorant_show_last_match: string;
  valorant_last_match_label: string;

  // Appearance
  valorant_theme: 'classic' | 'neon' | 'glass' | 'minimal';
  valorant_show_bg: string;
  valorant_shine: string;
  valorant_bg_color: string;
  valorant_bg_opacity: string;
  valorant_text_color: string;
  valorant_accent_color: string;
  valorant_border_color: string;
  valorant_show_border: string;
  valorant_radius: string;
  valorant_scale: string;
  valorant_font: string;
}

export interface ValorantMatchHistoryItem {
  match_id: string;
  map?: {
    name: string;
    id: string;
  };
  tier?: {
    id: number;
    name: string;
  };
  ranking_in_tier: number;
  mmr_change_to_last_game: number;
  elo?: number;
  date: string;
}

export interface ValorantRankData {
  name: string;
  tag: string;
  currenttierpatched: string;
  currenttier: number;
  ranking_in_tier: number;
  elo: number;
  images: {
    small: string;
    large: string;
    triangle_down?: string;
    triangle_up?: string;
  };
  wins: number;
  losses: number;
  last_match_change: number;
  updated_at: string;
}

