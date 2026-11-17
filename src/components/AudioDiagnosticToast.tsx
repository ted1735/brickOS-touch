import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Search,
  RefreshCw,
  X,
  Folder,
  Music,
  Play
} from 'lucide-react';
import { getSavedNextcloudConfig, saveRelinkedStemOverride } from '../utils/nextcloudStream';

export type DiagnosticType = 'suno-fallback' | 'relinked' | 'searching' | 'error' | 'info';

export interface AudioDiagnosticDetail {
  type: DiagnosticType;
  trackId?: string;
  trackTitle?: string;
  channelId?: number;
  stemName?: string;
  stemType?: string;
  originalPath?: string;
  resolvedUrl?: string;
  message: string;
  details?: string;
  latencyMs?: number;
  canRelink?: boolean;
}

interface SunoRevisionOption {
  suno_clip_id?: string;
  sunoClipId?: string;
  title: string;
  stream_url?: string;
  streamUrl?: string;
  model?: string;
  created_at?: string;
  createdAt?: string;
}

interface AffectedStem {
  channelId?: number;
  name: string;
  stemType?: string;
  originalPath?: string;
}

interface ConsolidatedToastCard {
  id: string;
  groupKey: string;
  type: DiagnosticType;
  trackId?: string;
  trackTitle?: string;
  originalPath?: string;
  resolvedUrl?: string;
  message: string;
  details?: string;
  latencyMs?: number;
  affectedStems: AffectedStem[];
  revisions: SunoRevisionOption[];
  selectedRevisionUrl: string;
  autoRelinkAttempted: boolean;
  timestamp: number;
}

// Global helper to broadcast audio diagnostic events from anywhere in the app
export function emitAudioDiagnostic(detail: AudioDiagnosticDetail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('brickos:audio-diagnostic', { detail }));
  }
}

interface AudioDiagnosticToastProps {
  onOpenWebDavExplorer?: (folderPath?: string) => void;
  onTrackRelinked?: (trackId: string, newPath: string) => void;
}

export const AudioDiagnosticToast: React.FC<AudioDiagnosticToastProps> = ({
  onOpenWebDavExplorer,
  onTrackRelinked
}) => {
  const [cards, setCards] = useState<ConsolidatedToastCard[]>([]);
  const [isRelinking, setIsRelinking] = useState<Record<string, boolean>>({});
  const fetchedRevisionsRef = useRef<Set<string>>(new Set());

  const removeCard = useCallback((id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const loadRevisionsForTrack = useCallback(async (trackId: string, trackTitle?: string) => {
    if (!trackId || !/^TRK-\d+/i.test(trackId) || fetchedRevisionsRef.current.has(trackId)) return;
    fetchedRevisionsRef.current.add(trackId);
    try {
      const url = `/api/catalog/revisions/${encodeURIComponent(trackId)}${trackTitle ? `?title=${encodeURIComponent(trackTitle)}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const revs: SunoRevisionOption[] = (data.revisions || []).filter(
        (r: SunoRevisionOption) => r.stream_url || r.streamUrl
      );
      if (revs.length > 0) {
        const firstUrl = revs[0].stream_url || revs[0].streamUrl || '';
        setCards((prev) =>
          prev.map((c) =>
            c.trackId === trackId
              ? { ...c, revisions: revs, selectedRevisionUrl: c.selectedRevisionUrl || firstUrl }
              : c
          )
        );
      }
    } catch {
      // ignore fetch error
    }
  }, []);

  const runRelinkForCard = useCallback(
    async (card: ConsolidatedToastCard, manualTrigger: boolean = false) => {
      if (!card.trackId && !card.originalPath && !card.trackTitle) return;
      const cardId = card.id;
      const primaryStem = card.affectedStems[0];

      setIsRelinking((prev) => ({ ...prev, [cardId]: true }));
      setCards((prev) =>
        prev.map((c) =>
          c.id === cardId
            ? {
                ...c,
                type: 'searching',
                autoRelinkAttempted: true,
                message: `Scanning Nextcloud WebDAV for '${c.trackTitle || c.trackId}'...`
              }
            : c
        )
      );

      try {
        const cfg = getSavedNextcloudConfig();
        const res = await fetch('/api/nextcloud/auto-relink', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trackId: card.trackId,
            trackTitle: card.trackTitle,
            stemName: primaryStem?.name,
            stemType: primaryStem?.stemType,
            originalPath: primaryStem?.originalPath || card.originalPath,
            filename: (primaryStem?.originalPath || card.originalPath)?.split('/').pop(),
            serverUrl: cfg.serverUrl,
            username: cfg.username,
            password: cfg.appPassword
          })
        });

        const data = await res.json();
        const returnedRevs: SunoRevisionOption[] = Array.isArray(data.revisions) ? data.revisions : [];

        if (res.ok && data.success && data.matchedPath) {
          const isSunoSource = data.source === 'suno_cloudfront';
          const resolvedTrackId = data.trackId || card.trackId || '';
          const matchedFile = data.filename || String(data.matchedPath).split('/').pop() || 'Audio Asset';

          if (resolvedTrackId) {
            if (isSunoSource) {
              saveRelinkedStemOverride({
                trackId: resolvedTrackId,
                channelId: primaryStem?.channelId,
                stemType: primaryStem?.stemType,
                directUrl: data.streamUrl || data.matchedPath
              });
            } else {
              saveRelinkedStemOverride({
                trackId: resolvedTrackId,
                channelId: primaryStem?.channelId,
                stemType: primaryStem?.stemType,
                webdavPath: data.matchedPath
              });
            }
          }

          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('brickos:track-relinked', {
                detail: {
                  trackId: resolvedTrackId,
                  trackTitle: card.trackTitle,
                  channelId: primaryStem?.channelId,
                  stemType: primaryStem?.stemType,
                  newPath: data.matchedPath,
                  streamUrl: data.streamUrl,
                  source: data.source,
                  discoveredFiles: data.discoveredFiles || []
                }
              })
            );
          }

          if (onTrackRelinked && resolvedTrackId) {
            onTrackRelinked(resolvedTrackId, data.matchedPath);
          }

          const sourceLabel =
            data.source === 'live_propfind'
              ? 'Live WebDAV PROPFIND'
              : data.source === 'sqlite_index'
              ? 'SQLite Catalog Index'
              : data.source === 'suno_cloudfront'
              ? 'Suno CloudFront Revision'
              : 'Canonical Audio Map';

          setCards((prev) =>
            prev.map((c) =>
              c.id === cardId
                ? {
                    ...c,
                    type: isSunoSource ? 'suno-fallback' : 'relinked',
                    resolvedUrl: data.matchedPath,
                    latencyMs: data.latencyMs,
                    revisions: returnedRevs.length > 0 ? returnedRevs : c.revisions,
                    selectedRevisionUrl:
                      c.selectedRevisionUrl ||
                      returnedRevs[0]?.streamUrl ||
                      returnedRevs[0]?.stream_url ||
                      '',
                    message: isSunoSource
                      ? `WebDAV missing — playing Suno studio take (${matchedFile})`
                      : `Relinked to ${matchedFile} (${data.latencyMs || 25}ms)`,
                    details: `Verified via ${sourceLabel}`
                  }
                : c
            )
          );

          if (!isSunoSource) {
            setTimeout(() => removeCard(cardId), 6000);
          }
        } else {
          setCards((prev) =>
            prev.map((c) =>
              c.id === cardId
                ? {
                    ...c,
                    type: 'error',
                    revisions: returnedRevs.length > 0 ? returnedRevs : c.revisions,
                    selectedRevisionUrl:
                      c.selectedRevisionUrl ||
                      returnedRevs[0]?.streamUrl ||
                      returnedRevs[0]?.stream_url ||
                      '',
                    message:
                      data.message ||
                      `Could not locate '${c.trackTitle || c.trackId}' in Nextcloud directories.`,
                    details: manualTrigger
                      ? 'Pick a Suno revision below or browse WebDAV folders manually.'
                      : 'Tap Auto-Relink, choose a Suno take below, or Locate in WebDAV.'
                  }
                : c
            )
          );
        }
      } catch (err: any) {
        setCards((prev) =>
          prev.map((c) =>
            c.id === cardId
              ? {
                  ...c,
                  type: 'error',
                  message: `Relink scan failed: ${err.message}`
                }
              : c
          )
        );
      } finally {
        setIsRelinking((prev) => ({ ...prev, [cardId]: false }));
      }
    },
    [onTrackRelinked, removeCard]
  );

  useEffect(() => {
    const handleEvent = (event: Event) => {
      const detail = (event as CustomEvent<AudioDiagnosticDetail>).detail;
      if (!detail) return;

      const groupKey = (detail.trackId || detail.trackTitle || detail.message).toUpperCase();
      const stemEntry: AffectedStem | null = detail.stemName
        ? {
            channelId: detail.channelId,
            name: detail.stemName,
            stemType: detail.stemType,
            originalPath: detail.originalPath
          }
        : null;

      let cardToAutoProcess: ConsolidatedToastCard | null = null;

      setCards((prev) => {
        const existingIdx = prev.findIndex((c) => c.groupKey === groupKey);
        if (existingIdx !== -1) {
          const existing = prev[existingIdx];
          const stems = [...existing.affectedStems];
          if (stemEntry && !stems.some((s) => s.name === stemEntry.name)) {
            stems.push(stemEntry);
          }
          const updated: ConsolidatedToastCard = {
            ...existing,
            affectedStems: stems,
            originalPath: existing.originalPath || detail.originalPath,
            timestamp: Date.now(),
            // Keep active 'searching' or 'relinked' status instead of clobbering it with duplicate channel errors
            type:
              existing.type === 'searching' || existing.type === 'relinked'
                ? existing.type
                : detail.type,
            message:
              existing.type === 'searching' || existing.type === 'relinked'
                ? existing.message
                : stems.length > 1
                ? `${stems.length} stems need relinking for ${detail.trackTitle || detail.trackId}`
                : detail.message
          };
          const next = [...prev];
          next[existingIdx] = updated;
          return next;
        }

        const newId = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const created: ConsolidatedToastCard = {
          id: newId,
          groupKey,
          type: detail.type,
          trackId: detail.trackId,
          trackTitle: detail.trackTitle,
          originalPath: detail.originalPath,
          resolvedUrl: detail.resolvedUrl,
          message: detail.message,
          details: detail.details,
          latencyMs: detail.latencyMs,
          affectedStems: stemEntry ? [stemEntry] : [],
          revisions: [],
          selectedRevisionUrl: '',
          autoRelinkAttempted: false,
          timestamp: Date.now()
        };

        if (detail.type === 'error' && detail.canRelink !== false) {
          cardToAutoProcess = created;
        }

        if (detail.type === 'relinked' || detail.type === 'info') {
          setTimeout(() => removeCard(newId), 5500);
        } else if (detail.type === 'suno-fallback') {
          setTimeout(() => removeCard(newId), 12000);
        }

        return [created, ...prev].slice(0, 2);
      });

      if (detail.trackId) {
        loadRevisionsForTrack(detail.trackId, detail.trackTitle);
      }

      if (cardToAutoProcess) {
        const targetCard = cardToAutoProcess as ConsolidatedToastCard;
        setTimeout(() => {
          runRelinkForCard(targetCard, false);
        }, 120);
      }
    };

    window.addEventListener('brickos:audio-diagnostic', handleEvent);
    return () => {
      window.removeEventListener('brickos:audio-diagnostic', handleEvent);
    };
  }, [loadRevisionsForTrack, removeCard, runRelinkForCard]);

  const handlePlaySelectedRevision = (card: ConsolidatedToastCard) => {
    const revUrl = card.selectedRevisionUrl;
    if (!revUrl) return;
    const revObj = card.revisions.find((r) => (r.stream_url || r.streamUrl) === revUrl);
    if (card.trackId) {
      saveRelinkedStemOverride({
        trackId: card.trackId,
        directUrl: revUrl
      });
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('brickos:play-suno-revision', {
          detail: {
            trackId: card.trackId,
            trackTitle: card.trackTitle || revObj?.title,
            streamUrl: revUrl,
            revisionTitle: revObj?.title || 'Suno Studio Take'
          }
        })
      );
    }
    setCards((prev) =>
      prev.map((c) =>
        c.id === card.id
          ? {
              ...c,
              type: 'suno-fallback',
              message: `Playing Suno CloudFront take: ${revObj?.title || card.trackTitle || 'Studio Take'}`,
              details: revObj?.model ? `Model ${revObj.model}` : 'Direct CloudFront Proxy'
            }
          : c
      )
    );
  };

  if (cards.length === 0) return null;

  return (
    <aside
      aria-label="Audio Stream Diagnostics"
      className="fixed bottom-36 lg:bottom-6 right-2 sm:right-6 z-50 flex flex-col gap-2.5 max-w-md w-full px-3 sm:px-0 pointer-events-none"
    >
      {cards.map((card) => {
        const isFallback = card.type === 'suno-fallback';
        const isRelinked = card.type === 'relinked';
        const isSearching = card.type === 'searching';
        const isError = card.type === 'error';

        return (
          <div
            key={card.id}
            className={`pointer-events-auto p-4 rounded-2xl border backdrop-blur-md shadow-2xl transition-all duration-300 ${
              isFallback
                ? 'bg-slate-900/95 border-amber-500/40 text-slate-100 ring-1 ring-amber-500/20'
                : isRelinked
                ? 'bg-slate-900/95 border-emerald-500/40 text-slate-100 ring-1 ring-emerald-500/20'
                : isSearching
                ? 'bg-slate-900/95 border-cyan-500/40 text-slate-100 ring-1 ring-cyan-500/20'
                : isError
                ? 'bg-slate-900/95 border-rose-500/40 text-slate-100 ring-1 ring-rose-500/20'
                : 'bg-slate-900/95 border-slate-700/60 text-slate-100'
            }`}
          >
            {/* Header Row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {isFallback && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                {isRelinked && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                {isSearching && <Search className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />}
                {isError && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}

                <span
                  className={`text-xs font-semibold uppercase tracking-wider truncate ${
                    isFallback
                      ? 'text-amber-400'
                      : isRelinked
                      ? 'text-emerald-400'
                      : isSearching
                      ? 'text-cyan-400'
                      : isError
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  {isFallback
                    ? 'Suno CloudFront Preview'
                    : isRelinked
                    ? 'Asset Relinked'
                    : isSearching
                    ? 'Live WebDAV Scan'
                    : isError
                    ? 'Audio Link Recovery'
                    : 'Audio Diagnostic'}
                </span>

                {card.trackId && (
                  <span className="text-xs font-mono text-slate-400 shrink-0">
                    · {card.trackId}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeCard(card.id)}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-slate-200 transition rounded-lg cursor-pointer -mr-1.5 -mt-1.5"
                title="Dismiss diagnostic card"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Consolidated Message & Affected Stems */}
            <div className="mt-2 text-xs leading-relaxed text-slate-200 space-y-1">
              <p className="font-medium text-slate-100">{card.message}</p>
              {card.affectedStems.length > 0 && (
                <p className="text-[11px] text-slate-400 truncate">
                  Stems: {card.affectedStems.map((s) => s.name).join(', ')}
                </p>
              )}
              {card.originalPath && (
                <p
                  className="text-[11px] font-mono text-slate-400 truncate"
                  title={card.originalPath}
                >
                  Path: {card.originalPath}
                </p>
              )}
              {card.details && (
                <p className="text-[11px] text-slate-400">{card.details}</p>
              )}
            </div>

            {/* Inline Suno Revision Picker */}
            {card.revisions.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-2">
                <label className="text-[11px] font-medium text-amber-300/90 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 shrink-0" />
                  <span>Suno Studio Revision ({card.revisions.length} available)</span>
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={card.selectedRevisionUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCards((prev) =>
                        prev.map((c) => (c.id === card.id ? { ...c, selectedRevisionUrl: val } : c))
                      );
                    }}
                    className="flex-1 min-w-0 min-h-[44px] px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    aria-label="Select Suno Revision"
                  >
                    {card.revisions.map((rev, idx) => {
                      const url = rev.stream_url || rev.streamUrl || '';
                      const id = rev.suno_clip_id || rev.sunoClipId || String(idx);
                      const model = rev.model ? ` · ${rev.model}` : '';
                      return (
                        <option key={id} value={url}>
                          Take {idx + 1}: {rev.title}
                          {model}
                        </option>
                      );
                    })}
                  </select>
                  <button
                    type="button"
                    onClick={() => handlePlaySelectedRevision(card)}
                    className="min-h-[44px] px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shrink-0 active:scale-95 transition cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play Take</span>
                  </button>
                </div>
              </div>
            )}

            {/* Touch-Friendly Recovery Action Buttons */}
            {(isFallback || isError || isSearching) && (
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => runRelinkForCard(card, true)}
                    disabled={isRelinking[card.id] || isSearching}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer flex-1 sm:flex-initial"
                  >
                    {isRelinking[card.id] || isSearching ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    <span>{isRelinking[card.id] || isSearching ? 'Scanning WebDAV...' : 'Auto-Relink Asset'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const folder = card.originalPath && card.originalPath.includes('/')
                        ? card.originalPath.substring(0, card.originalPath.lastIndexOf('/'))
                        : undefined;
                      if (onOpenWebDavExplorer) {
                        onOpenWebDavExplorer(folder);
                      } else if (typeof window !== 'undefined') {
                        window.dispatchEvent(
                          new CustomEvent('brickos:open-webdav-explorer', {
                            detail: { folderPath: folder, trackId: card.trackId }
                          })
                        );
                      }
                      removeCard(card.id);
                    }}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 border border-slate-700 flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
                  >
                    <Folder className="w-3.5 h-3.5" />
                    <span>Locate</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
};
