import { Track, TrackVersion } from '../types';

export interface ParsedLyricSection {
  tag: string;         // e.g., "[Verse 1]" or "[Chorus]"
  cleanTag: string;    // e.g., "Verse 1" or "Chorus"
  content: string;     // Full text of the section
  lineCount: number;   // Number of non-empty lines
  charCount: number;   // Total character count
}

/**
 * Standard structural song section keywords.
 * Used to differentiate primary arrangement milestones from technical Suno/Nashville cues.
 */
const STRUCTURAL_KEYWORDS = [
  'intro',
  'verse',
  'pre-chorus',
  'pre chorus',
  'prechorus',
  'chorus',
  'hook',
  'bridge',
  'drop',
  'outro',
  'refrain',
  'vamp',
  'solo',
  'guitar solo',
  'breakdown',
  'interlude',
  'build-up',
  'buildup',
  'build',
  'coda',
  'tag',
  'selah',
  'ending',
  'post-chorus',
  'turnaround',
  'spoken word',
  'spoken',
  'section',
  'part'
];

/**
 * Checks whether a bracket string like "[Verse 1]" is a structural arrangement tag
 * vs an instrumentation/style cue like "[Heavy K-Pop 808 bass, futuristic synth plucks]"
 */
export function isStructuralTag(tagStr: string): boolean {
  const clean = tagStr.replace(/[[\]]/g, '').trim().toLowerCase();
  if (!clean) return false;
  return STRUCTURAL_KEYWORDS.some(keyword => {
    // Exact match or starts with keyword (e.g. "Verse 1", "Chorus (Explosive)", "Intro | Cinematic Whistle")
    return clean === keyword || clean.startsWith(keyword + ' ') || clean.startsWith(keyword + ':') || clean.startsWith(keyword + ' -') || clean.startsWith(keyword + ' |');
  });
}

/**
 * Intelligently retrieves substantive, complete lyrics for a Track.
 * Prevents returning 1-line truncated summary snippets (e.g. ending in '...')
 * when the parent track or other versions contain the complete lyrics.
 */
export function getSubstantiveLyrics(track: Track, versionIndex?: number): string {
  if (!track) return '';

  const isComplete = (text?: string): boolean => {
    if (!text) return false;
    const trimmed = text.trim();
    // If it's very short or ends with ellipsis or has truncation markers, it's not substantive
    if (trimmed.length < 100 && (trimmed.endsWith('...') || trimmed.endsWith('…') || trimmed.includes('...'))) {
      return false;
    }
    return trimmed.length > 0;
  };

  // 1. If a specific version index is provided, check if it has full lyrics
  if (versionIndex !== undefined && track.versions && track.versions[versionIndex]) {
    const vLyrics = track.versions[versionIndex].lyrics;
    if (isComplete(vLyrics) && (!track.lyrics || vLyrics.length >= track.lyrics.length * 0.5)) {
      return vLyrics.trim();
    }
  }

  // 2. Prefer track.lyrics if substantive
  if (track.lyrics && isComplete(track.lyrics)) {
    return track.lyrics.trim();
  }

  // 3. Fall back to any version that has substantive lyrics
  if (track.versions && track.versions.length > 0) {
    for (const v of track.versions) {
      if (v.lyrics && isComplete(v.lyrics)) {
        return v.lyrics.trim();
      }
    }
    // As absolute last resort, return whatever version 0 has
    if (track.versions[0]?.lyrics) {
      return track.versions[0].lyrics.trim();
    }
  }

  return (track.lyrics || '').trim();
}

/**
 * Robust, lossless lyric parser for Nashville & Suno 4-Block format lyrics.
 * - Extracts every verse, chorus, bridge, and outro in full without dropping lines.
 * - Correctly absorbs instrumentation/style cues inside sections instead of creating empty cards.
 * - Supports both bracketed songs and stanza-separated songs.
 */
export function parseLyricSections(rawLyrics: string): ParsedLyricSection[] {
  if (!rawLyrics || !rawLyrics.trim()) return [];

  const text = rawLyrics.trim();
  const bracketRegex = /\[([^\]]+)\]/g;
  const rawMatches: Array<{ tag: string; cleanTag: string; index: number; fullLength: number }> = [];

  let match: RegExpExecArray | null;
  while ((match = bracketRegex.exec(text)) !== null) {
    rawMatches.push({
      tag: `[${match[1].trim()}]`,
      cleanTag: match[1].trim(),
      index: match.index,
      fullLength: match[0].length
    });
  }

  // Case 1: No bracketed headers found — split by stanza breaks (\n\n+)
  if (rawMatches.length === 0) {
    const stanzas = text.split(/\n\s*\n+/).filter(s => s.trim().length > 0);
    return stanzas.map((stanza, idx) => {
      const trimmed = stanza.trim();
      const lines = trimmed.split('\n').filter(l => l.trim().length > 0);
      let tag = `[Section ${idx + 1}]`;
      let cleanTag = `Section ${idx + 1}`;

      // Smart label heuristics for unbracketed stanzas
      if (idx === 0) {
        tag = '[Intro]';
        cleanTag = 'Intro';
      } else if (idx === 1) {
        tag = '[Verse 1]';
        cleanTag = 'Verse 1';
      } else if (idx === 2) {
        tag = '[Chorus]';
        cleanTag = 'Chorus';
      } else if (idx === 3) {
        tag = '[Verse 2]';
        cleanTag = 'Verse 2';
      } else if (idx === 4) {
        tag = '[Bridge]';
        cleanTag = 'Bridge';
      } else if (idx === stanzas.length - 1 && stanzas.length > 3) {
        tag = '[Outro]';
        cleanTag = 'Outro';
      }

      return {
        tag,
        cleanTag,
        content: trimmed,
        lineCount: lines.length,
        charCount: trimmed.length
      };
    });
  }

  // Case 2: Bracketed headers exist.
  // Group structural section tags and preserve all text and non-structural tags in section content.
  const sections: ParsedLyricSection[] = [];

  // 2a. Check for preamble text before the first bracket
  if (rawMatches[0].index > 0) {
    const preamble = text.slice(0, rawMatches[0].index).trim();
    if (preamble.length > 0) {
      // If preamble is just a song title on 1 line and nothing else, ignore if followed immediately by [Intro]
      const preambleLines = preamble.split('\n').filter(l => l.trim().length > 0);
      if (preambleLines.length > 1 || !preamble.toLowerCase().includes(rawMatches[0].cleanTag.toLowerCase())) {
        sections.push({
          tag: '[Intro / Title]',
          cleanTag: 'Intro / Title',
          content: preamble,
          lineCount: preambleLines.length,
          charCount: preamble.length
        });
      }
    }
  }

  // 2b. Iterate through bracket matches
  for (let i = 0; i < rawMatches.length; i++) {
    const current = rawMatches[i];
    const contentStart = current.index + current.fullLength;
    const contentEnd = i + 1 < rawMatches.length ? rawMatches[i + 1].index : text.length;
    let sectionBody = text.slice(contentStart, contentEnd).trim();

    // Check if next matches are non-structural cues (e.g. [Fast acoustic strumming]) that should be absorbed
    while (
      i + 1 < rawMatches.length &&
      !isStructuralTag(rawMatches[i + 1].tag) &&
      sectionBody.length === 0
    ) {
      // The current structural header had an immediate sub-cue (e.g. [Verse 1]\n[Fast rap flow])
      i++;
      const nextMatch = rawMatches[i];
      const nextContentStart = nextMatch.index + nextMatch.fullLength;
      const nextContentEnd = i + 1 < rawMatches.length ? rawMatches[i + 1].index : text.length;
      const subBody = text.slice(nextContentStart, nextContentEnd).trim();
      sectionBody = `${nextMatch.tag}${subBody ? `\n${subBody}` : ''}`;
    }

    // Determine normalized clean tag (e.g. "[Intro | Cinematic Whistle]" -> clean tag "Intro", full tag preserved)
    const cleanTagNormalized = current.cleanTag.split('|')[0].split(':')[0].trim();

    const nonBlankLines = sectionBody
      .split('\n')
      .filter(l => l.trim().length > 0);

    sections.push({
      tag: current.tag,
      cleanTag: cleanTagNormalized || current.cleanTag,
      content: sectionBody || `(${current.tag} - Instrumental / Musical passage)`,
      lineCount: Math.max(1, nonBlankLines.length),
      charCount: sectionBody.length
    });
  }

  return sections;
}
