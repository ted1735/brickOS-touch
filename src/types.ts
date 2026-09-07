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

export interface Track {
  id: string;
  ep: string;
  title: string;
  status: 'Idea / Concept' | 'Lyrics Finalized' | 'In Progress' | 'UVR5 Stem Prep' | 'Audio Master' | 'Sent for Distribution' | 'Released';
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
  selahPrayed?: boolean;
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
