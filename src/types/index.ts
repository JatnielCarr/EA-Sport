// Minimal types for Swagger setup
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DetailedUserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  banner_url: string | null;
  verified: boolean;
  role: string;
  created_at: string;
  subscription: {
    plan: 'FREE' | 'STANDARD' | 'PREMIUM';
    status: string;
  } | null;
  clan: {
    name: string;
    tag: string;
    role: string;
    joined_at: string;
    member_count: number;
  } | null;
  stats: {
    rating: number;     // ELO/MR
    win_rate: number;   // Percentage
    matches: number;    // Total matches
    rank?: string;      // "Gold", "Diamond", etc.
  };
  social_links?: {
    telegram?: string;
    discord?: string;
    steam?: string;
  };
}
