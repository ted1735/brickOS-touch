export type TrackStatus = 
  | 'Idea / Concept' 
  | 'Lyrics Finalized' 
  | 'In Progress' 
  | 'UVR5 Stem Prep' 
  | 'Audio Master' 
  | 'Sent for Distribution' 
  | 'Released';

export interface TrackVersion {
  version: string;
  timestamp: string;
  reason: string;
  lyrics: string;
}

export interface EngineSliders {
  weirdness: number;
  styleInfluence: number;
  voiceAudio: number;
}

export interface AuditFeedbackRecord {
  id: string;
  timestamp: string;
  model: string;
  feedback: string;
  status: 'pending' | 'applied' | 'dismissed';
  preRevisionVersion?: string;
  postRevisionVersion?: string;
}

export interface CompositionSessionSnapshot {
  lyrics: string;
  sunoPrompt: string;
  negativePrompt: string;
  engineSliders: EngineSliders;
  bpm: number;
  key: string;
  genre: string;
  vocal: string;
  vocalCast: string;
  thesis: string;
  selahPrayed?: boolean;
  status: TrackStatus;
  notes?: string;
  versionsCount: number;
  latestVersionTag?: string;
}

export interface CompositionSession {
  id: string;
  name: string;
  trackId: string;
  trackTitle: string;
  ep: string;
  createdAt: string;
  updatedAt: string;
  activeTab?: string;
  description?: string;
  tags: string[];
  isPinned?: boolean;
  color?: string;
  snapshot: CompositionSessionSnapshot;
}

export interface Track {
  id: string;
  ep: string;
  title: string;
  status: TrackStatus;
  genre: string;
  bpm: number;
  key: string;
  vocal: string;
  vocalCast: string;
  thesis: string;
  sunoPrompt: string;
  negativePrompt: string;
  engineSliders: EngineSliders;
  lyrics: string;
  versions: TrackVersion[];
  auditHistory?: AuditFeedbackRecord[];
  selahPrayed?: boolean;
  notes?: string;
}

export interface EPCollection {
  id: string;
  title: string;
  theme: string;
}

export interface NightCafePrompt {
  song: string;
  idx: number;
  title: string;
  prompt: string;
  aspectRatio?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model: string;
}

export interface MixerTrack {
  id: number;
  name: string;
  vol: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  trimIn: number;
  trimOut: number;
  freq: number;
  waveType: OscillatorType;
  color: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: string;
  timestamp: string;
  mode: 'create' | 'edit';
  trackTitle?: string;
}

export interface GeneratedVideo {
  id: string;
  operationName: string;
  prompt: string;
  aspectRatio: '16:9' | '9:16';
  videoUrl?: string;
  status: 'pending' | 'ready' | 'failed';
  timestamp: string;
  modelUsed: string;
  trackTitle?: string;
}

export interface YouTubeSEOReport {
  trackId: string;
  format: 'shorts' | 'longform';
  title: string;
  description: string;
  tags40Genre: string[];
  tags60Semantic: string[];
  schedulingWindow: string;
  signatureBlock: string;
  thumbnailPrompt1: string;
  thumbnailPrompt2: string;
  thumbnailPrompt3: string;
  woodworkingViolations: string[];
  score: number;
}

export interface OmniPostCampaign {
  id: string;
  trackTitle: string;
  template: 'viral_hook' | 'selah_bts' | 'anthem_drop' | 'fitness_15k';
  captionTikTok: string;
  captionIGReels: string;
  captionYTShorts: string;
  hashtags: string[];
  scheduledDate: string;
  audioStemUrl: string;
}

export interface ChordSheet {
  songTitle: string;
  key: string;
  bpm: number;
  timeSignature: string;
  chordProText: string;
  nashvilleText: string;
}

export type OfficialVocalArchetype = 
  | 'The Architect' 
  | 'Brandon' 
  | 'Ms T' 
  | 'Monica' 
  | 'Kane'
  | 'PATD'
  | 'Silas Thorne'
  | 'Neon Gospel';

export interface VocalArchetypeRecord {
  name: OfficialVocalArchetype;
  archetypeTitle: string;
  role: string;
  formantTexture: string;
  recommendedGenres: string;
}

export type StemPassType = 
  | 'Primary_Vocal' 
  | 'True_Instrumental' 
  | 'Dry_Studio_Vocal' 
  | 'DAW_Master_Session';

export interface AudioStemRecord {
  id: string;
  trackId: string;
  passType: StemPassType;
  modelUsed: string; // e.g. 'BS-Roformer-Viperx', 'Kim-Inst-v2', 'FoxJoy-DeReverb'
  isCompleted: boolean;
  webdavRelativePath: string;
  fullWebdavUrl: string;
  fileSizeBytes: number;
  sampleRateHz: number;
  bitDepth: number;
}

export type VisualAssetType = 
  | 'Album_Cover_Master' 
  | 'Video_Seed_Frame' 
  | 'Lyric_Video_Storyboard' 
  | 'Social_Shorts_Thumbnail' 
  | 'B_Roll_Cinematic_Plate';

export interface VisualAssetRecord {
  id: string;
  trackId: string;
  versionId: string;
  assetType: VisualAssetType;
  aspectRatio: '1:1' | '9:16' | '16:9';
  title: string;
  prompt: string;
  isActiveMaster: boolean;
  webdavRelativePath: string;
  fullWebdavUrl: string;
  similarityTags: string[];
  compatibleTracks: string[];
}

export interface InterchangeableAssetLink {
  id: string;
  primaryTrackId?: string;
  title: string;
  assetCategory: 'TRACK_BOUND' | 'CROSS_CATALOG_SHARED';
  assetType: 'VISUAL' | 'AUDIO_STEM' | 'VIDEO_PLATE' | 'BRANDING';
  webdavRelativePath: string;
  fullWebdavUrl: string;
  similarityTags: string[];
  compatibleTracks: string[]; // e.g. ['TRK-01', 'TRK-03', 'TRK-04', 'TRK-24']
  themeCluster: 'Theme_SanctuaryCross' | 'Theme_BlueCollarGrit' | 'CrossCatalog_BRoll' | 'Universal' | 'Theme_SurrenderMask';
  description: string;
  previewUrl?: string;
}

export interface SOPRuleDefinition {
  id: string;
  name: string;
  description: string;
  triggerType: 'required_tag' | 'forbidden_phrase' | 'contains_any' | 'ratio' | 'custom';
  tags?: string[];
  bannedPhrases?: string[];
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
}

export interface SOPRulesPackage {
  version: string;
  updatedAt: string;
  rawMarkdown: string;
  cliches: string[];
  requiredTags: string[];
  throneRoomTriggers: string[];
  sonicScarRatio: string;
  rules: SOPRuleDefinition[];
}

export type NextcloudAssetCategory =
  | 'MASTER_AUDIO'
  | 'UVR5_VOCAL_STEM'
  | 'INSTRUMENTAL_STEM'
  | 'LYRIC_SOP_DOC'
  | 'VISUAL_ARTWORK'
  | 'VIDEO_REEL'
  | 'CHORD_MIDI'
  | 'UNCATEGORIZED';

export interface NextcloudFolderAsset {
  id: string;
  filename: string;
  folderId: string; // e.g. '207332'
  category: NextcloudAssetCategory;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  mimeType: string;
  webdavPath: string;
  shareUrl: string;
  matchedTrackId: string | null; // e.g. 'TRK-01' or null
  matchedTrackTitle?: string;
  matchConfidence: number; // 0 - 100
  suggestedTrackId?: string;
  suggestedCategory?: NextcloudAssetCategory;
  isMatched: boolean;
  bpm?: number;
  key?: string;
  audioDurationSeconds?: number;
  previewAudioType?: 'vocal' | 'harmony' | 'instrumental' | 'drums' | 'sawtooth';
  previewImageUrl?: string;
  notes?: string;
  lastSyncedAt: string;
}

export interface NextcloudSyncConfig {
  serverUrl: string;
  username: string;
  appPassword?: string;
  webdavRoot: string;
  folderIdOrShareUrl: string;
  lastConnectionStatus: 'connected' | 'unauthorized' | 'error' | 'idle';
  lastPingMs?: number;
  lastSyncTimestamp?: string;
}

