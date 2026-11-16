export interface McpServerPublic {
  id: string;
  name: string;
  url: string;
  authType: 'none' | 'bearer' | 'header';
  authHeaderName: string;
  authToken: string;
  hasAuthToken: boolean;
  enabled: boolean;
  isPrimary: boolean;
  lastStatus: string;
  lastLatencyMs: number;
  lastError: string;
  serverInfo: {
    name?: string;
    version?: string;
  };
  tools: McpToolDefinition[];
  resources: McpResourceDefinition[];
  lastSyncedAt: string | null;
}

export interface McpToolDefinition {
  name: string;
  description?: string;
  annotations?: {
    title?: string;
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
  };
  inputSchema?: {
    type?: string;
    properties?: Record<string, any>;
    required?: string[];
  };
}

export interface McpResourceDefinition {
  uri: string;
  name: string;
  mimeType?: string;
}

export interface McpPinnedWidget {
  id: string;
  serverId: string;
  toolName: string;
  title: string;
  args: Record<string, any>;
  lastResult: any;
  lastRunAt: string | null;
  createdAt: string;
}

export interface SocialOutletStatus {
  trackId: string;
  outletKey: string;
  status: string;
  scheduledSlot: string;
  postUrl: string;
  postId: string;
  cohort: string;
  playlistId: string;
  notes: string;
  updatedAt: string;
}

export interface YouTubeVideoStat {
  video_id: string;
  title: string;
  published_at: string;
  privacy_status?: string;
  duration_iso?: string;
  views: number;
  likes: number;
  comments: number;
  like_to_view_pct: number;
  url: string;
}

export interface ReadyShortItem {
  id: string;
  campaign: string;
  track: string;
  status: string;
  title: string;
  hook_text?: string;
  caption?: string;
  scheduled_slot?: string;
  youtube_id?: string;
  youtube_url?: string;
  spotify_url?: string;
  apple_music_url?: string;
  youtube_music_url?: string;
  video_asset_url?: string;
  thumbnail_asset_url?: string;
  format?: string;
  duration?: string;
  hook?: string;
  closing_screen?: string;
}

export interface MuseMessageItem {
  received_at?: string;
  agent: string;
  report_type: string;
  campaign?: string;
  message: string;
}

export interface McpTrackSummary {
  slug: string;
  title: string;
  genre_style: string | null;
  status: string;
  local_project_folder: string | null;
}

export interface DashboardIngestPayload {
  success: boolean;
  fetchedAt: string;
  latencyMs: number;
  fromCache?: boolean;
  cachedAt?: string;
  errors?: string[];
  servers: McpServerPublic[];
  youtube: {
    status: string;
    channel: {
      id: string;
      title: string;
      handle: string;
      subscribers: number;
      total_views: number;
      video_count: number;
    };
    summary: {
      videos_returned: number;
      rolling_median_views: number;
      total_recent_views: number;
      total_recent_likes: number;
      avg_like_to_view_pct: number;
    };
    videos: YouTubeVideoStat[];
  } | null;
  metaMuse: {
    reportsSummary: {
      status: string;
      reports_total: number;
      edison_reports_matched: number;
      latest_edison_reports?: MuseMessageItem[];
    } | null;
    messages: MuseMessageItem[];
    totalMessages: number;
  };
  googleSheet: {
    status?: string;
    sheet_id?: string;
    sheet_url?: string;
    tab?: string;
    error?: string;
    how_to_unlock?: string;
    rows?: any[];
  } | null;
  readyShorts: ReadyShortItem[];
  releaseLinks: {
    spotify_album?: string;
    spotify_track?: string;
    apple_music?: string;
    youtube_music?: string;
    youtube_music_video?: string;
    channel_handle?: string;
    brand_name?: string;
  };
  mcpTracks: McpTrackSummary[];
  progressMarkdown: string;
  outletStatuses: SocialOutletStatus[];
  pinnedWidgets: McpPinnedWidget[];
}

export const SOCIAL_OUTLET_DEFINITIONS = [
  {
    key: 'youtube_shorts',
    label: 'YouTube & Shorts',
    handle: '@brickRedeemed',
    source: 'YouTube Data API v3'
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    handle: '@brickredeemed',
    source: 'Manual / Slot Queue'
  },
  {
    key: 'instagram_reels',
    label: 'IG Reels (@brick + Knot)',
    handle: '@brickredeemed · @theknotcreations',
    source: 'Meta Muse (Edison)'
  },
  {
    key: 'facebook_x',
    label: 'Facebook Page & X',
    handle: 'brick FB Page · X',
    source: 'Meta Muse + X Queue'
  },
  {
    key: 'distro_streaming',
    label: 'Spotify & Apple DistroKit',
    handle: 'DistroKid / Streaming Masters',
    source: 'MCP Release Links'
  }
] as const;

export const OUTLET_STATUS_OPTIONS = [
  'Not Started',
  'Drafting',
  'Audit Passed',
  'Scheduled',
  'Published',
  'Needs Correction',
  'Vetoed / Pulled'
] as const;

export const CANONICAL_PLAYLISTS = [
  {
    id: 'PLJRa0B_te4hc',
    name: 'Midnight Burnout, Anxiety & Spiritual Warfare | Raw Christian Rap & Rock (brick)'
  },
  {
    id: 'PLE51ruPmQQUs',
    name: 'Latin Worship, Salsa Cristiana & High-Energy Praise | brick Records'
  },
  {
    id: 'PL3dwAgzZFops_wUTc4hbKC_L0VC9Bu2FZ',
    name: 'Gritty Southern Gospel Rock, Blues & Testimony Anthems | Ted Moyer (brick)'
  },
  {
    id: 'PL3dwAgzZFopt3l1bE8TnenxhGPi3EmX4a',
    name: 'America 250 Faith, Family & Heartland Revival Anthems (USA 250 Official Music)'
  }
] as const;

export const COHORT_RULES = [
  {
    id: 'Cohort A',
    name: 'Athletic, Grit & Endurance',
    window: 'Saturday Morning (05:15 AM EST; 05:00–08:30 AM)'
  },
  {
    id: 'Cohort B',
    name: 'Intergenerational Family & Fatherhood',
    window: 'Midday / Weekend Family Blocks (11:30 AM–02:30 PM EST)'
  },
  {
    id: 'Cohort C',
    name: 'Heartland, Roots & Surrender',
    window: 'Sunday Sanctuary (05:15 AM EST) or Weekday Evenings (07:45–08:30 PM EST)'
  },
  {
    id: 'Cohort D',
    name: 'Mature Marriage & Midnight Struggle',
    window: 'Weekday Evenings (07:45–08:30 PM EST)'
  }
] as const;

export function toTrackSlug(titleOrSlug: string): string {
  return String(titleOrSlug || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function matchMcpSlug(trackTitle: string, mcpTracks: McpTrackSummary[]): string {
  const norm = toTrackSlug(trackTitle);
  const exact = mcpTracks.find((m) => m.slug === norm || toTrackSlug(m.title) === norm);
  if (exact) return exact.slug;
  const partial = mcpTracks.find(
    (m) => norm.includes(m.slug) || m.slug.includes(norm)
  );
  return partial ? partial.slug : norm;
}

export function getTelemetryWindowTag(publishedAtIso?: string): {
  label: string;
  tone: 'neutral' | 'amber' | 'cyan' | 'emerald';
} {
  if (!publishedAtIso) return { label: 'Queued', tone: 'neutral' };
  const diffHours = (Date.now() - new Date(publishedAtIso).getTime()) / (1000 * 60 * 60);
  if (diffHours < 0) return { label: 'Scheduled', tone: 'cyan' };
  if (diffHours < 24) return { label: `T+${Math.max(1, Math.floor(diffHours))}h (24h Freeze)`, tone: 'amber' };
  if (diffHours < 72) return { label: `T+${Math.floor(diffHours)}h (Approaching T+72h)`, tone: 'cyan' };
  if (diffHours < 168) return { label: `T+${Math.floor(diffHours)}h (Rescue Window)`, tone: 'emerald' };
  return { label: `T+${Math.floor(diffHours / 24)}d Final`, tone: 'neutral' };
}

export function checkDaypartViolation(cohort: string, scheduledSlot: string): string | null {
  if (!scheduledSlot) return null;
  const lower = scheduledSlot.toLowerCase();
  const isSatMorning = lower.includes('sat') && (lower.includes('05:') || lower.includes('5:15') || lower.includes('morning'));
  if (isSatMorning && (cohort === 'Cohort C' || cohort === 'Cohort D')) {
    return `${cohort} blocked in Saturday 05:15 AM EST slot (reserved for Cohort A Athletic/Grit drops).`;
  }
  return null;
}
