export interface Donation {
  id?: number | string;
  name: string;
  amount: number;
  message?: string;
  transaction_ref?: string;
  trans_ref?: string;
  slip_url?: string;
  sender_name?: string;
  sender_bank?: string;
  receiver_name?: string;
  transaction_date?: string;
  status?: string;
  created_at?: string;
  isTest?: boolean;
  isReplay?: boolean;
}

export interface Setting {
  key: string;
  value: string;
}

export interface BlacklistWord {
  id: number;
  word: string;
}

export interface User {
  id: string;
  username: string;
  password_hash?: string;
  display_name?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserSession {
  userId: string;
  username: string;
  displayName: string;
  role: string;
  expiresAt: number;
}

export interface AlertSettings {
  alert_theme?: string;
  alert_font?: string;
  alert_card_bg?: string;
  alert_card_blur?: number | string;
  alert_card_width?: number | string;
  alert_border_color?: string;
  alert_border_width?: number | string;
  alert_border_radius?: number | string;
  alert_shadow_show?: string | boolean;
  alert_glow?: string | boolean;
  alert_shimmer_show?: string | boolean;
  alert_shimmer_color?: string;
  alert_card_beam?: string | boolean;
  alert_card_beam_color?: string;
  alert_confetti_enabled?: string | boolean;
  alert_particle_style?: 'confetti' | 'gold_sparkle' | 'hearts' | 'fire_sparks' | 'none' | string;
  alert_tiered_enabled?: string | boolean;
  alert_tiered_rare_min?: number | string;
  alert_tiered_epic_min?: number | string;
  alert_tiered_legendary_min?: number | string;
  alert_tiered_rare_color?: string;
  alert_tiered_rare_from?: string;
  alert_tiered_rare_to?: string;
  alert_tiered_epic_color?: string;
  alert_tiered_epic_from?: string;
  alert_tiered_epic_to?: string;
  alert_tiered_legendary_color?: string;
  alert_tiered_legendary_from?: string;
  alert_tiered_legendary_to?: string;
  alert_shine_sweep?: string | boolean;
  alert_shine_theme?: string;
  alert_icon?: string;
  alert_icon_bg?: string;
  alert_icon_color?: string;
  alert_icon_border?: string;
  alert_name_color?: string;
  alert_action_color?: string;
  alert_action_text?: string;
  alert_title_size?: number | string;
  alert_letter_spacing?: number | string;
  alert_word_gap?: number | string;
  alert_text_margin_top?: number | string;
  alert_text_margin_bottom?: number | string;
  alert_text_margin_left?: number | string;
  alert_text_margin_right?: number | string;
  alert_line_height?: number | string;
  alert_text_stroke_enabled?: string | boolean;
  alert_text_stroke_color?: string;
  alert_text_stroke_width?: number | string;
  alert_text_shadow?: 'none' | 'soft' | 'game' | string;
  alert_text_gradient_enabled?: string | boolean;
  alert_text_gradient_preset?: string;
  alert_text_gradient_from?: string;
  alert_text_gradient_to?: string;
  alert_text_gradient_angle?: number | string;
  alert_amount_bg?: string;
  alert_amount_color?: string;
  alert_amount_border?: string;
  alert_amount_size?: number | string;
  alert_icon_margin_bottom?: number | string;
  alert_msg_margin_top?: number | string;
  alert_msg_bg?: string;
  alert_msg_color?: string;
  alert_msg_border?: string;
  alert_msg_size?: number | string;
  alert_animation?: string;
  alert_duration?: number | string;
  alert_volume?: number | string;
  alert_sound_url?: string;
  tts_enabled?: string | boolean;
  tts_min_amount?: number | string;
  promptpay_id?: string;
  truemoney_phone?: string;
  receiver_name?: string;
  receiver_account?: string;
  min_donate?: string;
  slipok_branch_id?: string;
  slipok_api_key?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  code?: number;
}
