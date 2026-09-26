import { Track } from '../types';

export interface CamelotInfo {
  code: string;
  num: number;
  letter: 'A' | 'B';
  cleanKey: string;
}

export interface TrackMatchResult {
  track: Track;
  overallScore: number;
  harmonicScore: number;
  harmonicRelation: string;
  camelotA: string;
  camelotB: string;
  bpmScore: number;
  bpmRelation: string;
  bpmDiff: number;
  vocalScore: number;
  vocalRelation: string;
  themeScore: number;
  compatibleStems: string[];
}

// Canonical Camelot Key Map
const KEY_TO_CAMELOT: Record<string, { num: number; letter: 'A' | 'B'; cleanKey: string }> = {
  // Minor Keys (A)
  'ab minor': { num: 1, letter: 'A', cleanKey: 'Ab Minor' },
  'g# minor': { num: 1, letter: 'A', cleanKey: 'G# Minor' },
  'eb minor': { num: 2, letter: 'A', cleanKey: 'Eb Minor' },
  'd# minor': { num: 2, letter: 'A', cleanKey: 'D# Minor' },
  'bb minor': { num: 3, letter: 'A', cleanKey: 'Bb Minor' },
  'a# minor': { num: 3, letter: 'A', cleanKey: 'A# Minor' },
  'f minor': { num: 4, letter: 'A', cleanKey: 'F Minor' },
  'c minor': { num: 5, letter: 'A', cleanKey: 'C Minor' },
  'g minor': { num: 6, letter: 'A', cleanKey: 'G Minor' },
  'd minor': { num: 7, letter: 'A', cleanKey: 'D Minor' },
  'a minor': { num: 8, letter: 'A', cleanKey: 'A Minor' },
  'e minor': { num: 9, letter: 'A', cleanKey: 'E Minor' },
  'b minor': { num: 10, letter: 'A', cleanKey: 'B Minor' },
  'f# minor': { num: 11, letter: 'A', cleanKey: 'F# Minor' },
  'gb minor': { num: 11, letter: 'A', cleanKey: 'Gb Minor' },
  'c# minor': { num: 12, letter: 'A', cleanKey: 'C# Minor' },
  'db minor': { num: 12, letter: 'A', cleanKey: 'Db Minor' },

  // Major Keys (B)
  'b major': { num: 1, letter: 'B', cleanKey: 'B Major' },
  'f# major': { num: 2, letter: 'B', cleanKey: 'F# Major' },
  'gb major': { num: 2, letter: 'B', cleanKey: 'Gb Major' },
  'db major': { num: 3, letter: 'B', cleanKey: 'Db Major' },
  'c# major': { num: 3, letter: 'B', cleanKey: 'C# Major' },
  'ab major': { num: 4, letter: 'B', cleanKey: 'Ab Major' },
  'eb major': { num: 5, letter: 'B', cleanKey: 'Eb Major' },
  'bb major': { num: 6, letter: 'B', cleanKey: 'Bb Major' },
  'f major': { num: 7, letter: 'B', cleanKey: 'F Major' },
  'c major': { num: 8, letter: 'B', cleanKey: 'C Major' },
  'g major': { num: 9, letter: 'B', cleanKey: 'G Major' },
  'd major': { num: 10, letter: 'B', cleanKey: 'D Major' },
  'a major': { num: 11, letter: 'B', cleanKey: 'A Major' },
  'e major': { num: 12, letter: 'B', cleanKey: 'E Major' },
};

export function parseCamelot(keyStr: string): CamelotInfo {
  if (!keyStr) return { code: '8A', num: 8, letter: 'A', cleanKey: 'A Minor' };
  const normalized = keyStr.toLowerCase().trim()
    .replace('flat', 'b')
    .replace('sharp', '#')
    .replace(/m$/, ' minor');

  // Match lookup directly
  const found = KEY_TO_CAMELOT[normalized];
  if (found) {
    return {
      code: `${found.num}${found.letter}`,
      num: found.num,
      letter: found.letter,
      cleanKey: found.cleanKey,
    };
  }

  // Handle shorthand like "Dm" or "F#m" or "C"
  if (normalized.endsWith('m') || normalized.includes('minor')) {
    const root = normalized.replace('minor', '').replace('m', '').trim();
    const tryKey = `${root} minor`;
    if (KEY_TO_CAMELOT[tryKey]) {
      const match = KEY_TO_CAMELOT[tryKey];
      return { code: `${match.num}${match.letter}`, num: match.num, letter: match.letter, cleanKey: match.cleanKey };
    }
  } else {
    const root = normalized.replace('major', '').trim();
    const tryKey = `${root} major`;
    if (KEY_TO_CAMELOT[tryKey]) {
      const match = KEY_TO_CAMELOT[tryKey];
      return { code: `${match.num}${match.letter}`, num: match.num, letter: match.letter, cleanKey: match.cleanKey };
    }
  }

  // Default fallback
  return { code: '7A', num: 7, letter: 'A', cleanKey: 'D Minor' };
}

export function calculateHarmonicRelation(keyA: string, keyB: string): { score: number; label: string } {
  const cA = parseCamelot(keyA);
  const cB = parseCamelot(keyB);

  // Exact Match
  if (cA.code === cB.code) {
    return { score: 100, label: 'Harmonic Lock (Identical Key)' };
  }

  // Relative Major / Minor (Same number, different letter)
  if (cA.num === cB.num && cA.letter !== cB.letter) {
    return { score: 95, label: 'Relative Major/Minor (Flawless Blend)' };
  }

  // Adjacent 5th Modulation (Same letter, ±1 number)
  const diff = Math.abs(cA.num - cB.num);
  if (cA.letter === cB.letter && (diff === 1 || diff === 11)) {
    return { score: 90, label: 'Adjacent 5th Modulation (Harmonic Transition)' };
  }

  // Diagonal 5th (Different letter, ±1 number)
  if (cA.letter !== cB.letter && (diff === 1 || diff === 11)) {
    return { score: 85, label: 'Diagonal 5th (Subtle Color Shift)' };
  }

  // Energy Lift (+2 numbers on Camelot Wheel)
  const forwardStep = (cB.num - cA.num + 12) % 12;
  if (forwardStep === 2 && cA.letter === cB.letter) {
    return { score: 80, label: 'Energy Lift (+2 Camelot Modulation)' };
  }

  // Warmth Descent (-2 numbers on Camelot Wheel)
  if (forwardStep === 10 && cA.letter === cB.letter) {
    return { score: 75, label: 'Warmth Descent (-2 Camelot Drop)' };
  }

  // Semi-tone clash or complex
  return { score: 45, label: 'Dissonant / Complex Re-Harmonization' };
}

export function calculateBpmRelation(bpmA: number, bpmB: number): { score: number; label: string; diff: number } {
  const diff = Math.abs(bpmA - bpmB);

  if (diff <= 1) {
    return { score: 100, label: 'Exact Tempo Lock (Direct Stem Drop)', diff };
  }
  if (diff <= 3) {
    return { score: 95, label: 'Close Pocket (±1-3 BPM)', diff };
  }
  if (diff <= 6) {
    return { score: 85, label: 'Manageable Pitch Shift (±4-6 BPM)', diff };
  }

  // Half-time / Double-time pocket
  const isDouble = Math.abs(bpmA * 2 - bpmB) <= 4;
  const isHalf = Math.abs(bpmA - bpmB * 2) <= 4;
  if (isDouble || isHalf) {
    return { score: 92, label: 'Half/Double Time Pocket Match', diff };
  }

  const score = Math.max(25, Math.round(100 - diff * 2.5));
  return { score, label: `Tempo Variance: ±${diff} BPM`, diff };
}

export function calculateMatch(trackA: Track, trackB: Track): TrackMatchResult {
  const cA = parseCamelot(trackA.key);
  const cB = parseCamelot(trackB.key);

  const harmonic = calculateHarmonicRelation(trackA.key, trackB.key);
  const bpm = calculateBpmRelation(trackA.bpm, trackB.bpm);

  // Vocal affinity
  let vocalScore = 50;
  let vocalRelation = 'Distinct Lead Textures';
  if (trackA.vocal === trackB.vocal) {
    vocalScore = 100;
    vocalRelation = `Identical Vocal Archetype (${trackA.vocal})`;
  } else if (
    (trackA.vocal === 'The Architect' && trackB.vocal === 'Ms T') ||
    (trackA.vocal === 'Brandon' && trackB.vocal === 'Silas Thorne') ||
    (trackA.vocal === 'Monica' && trackB.vocal === 'Kane')
  ) {
    vocalScore = 85;
    vocalRelation = 'Complementary Duet & Formant Pair';
  }

  // Theme Affinity
  let themeScore = 60;
  if (trackA.ep === trackB.ep) {
    themeScore = 95;
  }

  const overallScore = Math.round(
    harmonic.score * 0.45 +
    bpm.score * 0.35 +
    vocalScore * 0.10 +
    themeScore * 0.10
  );

  // Determine compatible stems to suggest
  const stems: string[] = [];
  if (harmonic.score >= 85) stems.push('Ambient Pad & Reverb Drone');
  if (bpm.score >= 85) stems.push('808 Sub-Bass & Drum Loops');
  if (harmonic.score >= 90 && bpm.score >= 90) stems.push('UVR5 Dry Vocals & Ad-libs');
  if (stems.length === 0) stems.push('Background Soundscapes & B-Roll Visuals');

  return {
    track: trackB,
    overallScore,
    harmonicScore: harmonic.score,
    harmonicRelation: harmonic.label,
    camelotA: cA.code,
    camelotB: cB.code,
    bpmScore: bpm.score,
    bpmRelation: bpm.label,
    bpmDiff: bpm.diff,
    vocalScore,
    vocalRelation,
    themeScore,
    compatibleStems: stems,
  };
}

export function rankCatalogMatches(selectedTrack: Track, allTracks: Track[]): TrackMatchResult[] {
  return allTracks
    .filter((t) => t.id !== selectedTrack.id)
    .map((t) => calculateMatch(selectedTrack, t))
    .sort((a, b) => b.overallScore - a.overallScore);
}
