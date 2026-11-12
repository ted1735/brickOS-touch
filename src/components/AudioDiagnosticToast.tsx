import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CheckCircle, Search, RefreshCw, X, Folder, Music, ExternalLink } from 'lucide-react';

export type DiagnosticType = 'suno-fallback' | 'relinked' | 'searching' | 'error' | 'info';

export interface AudioDiagnosticDetail {
  type: DiagnosticType;
  trackId?: string;
  trackTitle?: string;
  originalPath?: string;
  resolvedUrl?: string;
  message: string;
  details?: string;
  latencyMs?: number;
  canRelink?: boolean;
}

interface ToastItem extends AudioDiagnosticDetail {
  id: string;
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
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isRelinking, setIsRelinking] = useState<Record<string, boolean>>({});

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleRelink = async (toast: ToastItem) => {
    if (!toast.trackId && !toast.originalPath && !toast.trackTitle) return;
    const toastId = toast.id;
    setIsRelinking((prev) => ({ ...prev, [toastId]: true }));

    // Notify user that scan is underway
    emitAudioDiagnostic({
      type: 'searching',
      trackId: toast.trackId,
      trackTitle: toast.trackTitle,
      message: `Scanning Nextcloud directories for '${toast.trackTitle || toast.trackId}'...`,
      originalPath: toast.originalPath
    });

    try {
      const res = await fetch('/api/nextcloud/auto-relink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: toast.trackId,
          filename: toast.originalPath?.split('/').pop(),
          trackTitle: toast.trackTitle
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.matchedPath) {
        // Emit success toast
        emitAudioDiagnostic({
          type: 'relinked',
          trackId: toast.trackId,
          trackTitle: toast.trackTitle,
          resolvedUrl: data.matchedPath,
          message: `Asset relinked to ${data.matchedPath.split('/').pop()} in ${data.latencyMs || 45}ms!`,
          details: `Source: ${data.matchedPath}`
        });

        if (onTrackRelinked && toast.trackId) {
          onTrackRelinked(toast.trackId, data.matchedPath);
        }
        removeToast(toastId);
      } else {
        emitAudioDiagnostic({
          type: 'error',
          trackId: toast.trackId,
          trackTitle: toast.trackTitle,
          message: data.message || `Could not find matching file in Nextcloud directories.`,
          canRelink: false
        });
      }
    } catch (err: any) {
      emitAudioDiagnostic({
        type: 'error',
        trackId: toast.trackId,
        trackTitle: toast.trackTitle,
        message: `Relink network request failed: ${err.message}`,
        canRelink: false
      });
    } finally {
      setIsRelinking((prev) => ({ ...prev, [toastId]: false }));
    }
  };

  useEffect(() => {
    const handleEvent = (event: Event) => {
      const customEvent = event as CustomEvent<AudioDiagnosticDetail>;
      if (!customEvent.detail) return;

      const newToast: ToastItem = {
        ...customEvent.detail,
        id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now()
      };

      setToasts((prev) => {
        // Keep at most 3 toasts visible at once, deduplicate same message
        const filtered = prev.filter((t) => t.message !== newToast.message);
        return [newToast, ...filtered].slice(0, 3);
      });

      // Auto-dismiss after timeout for non-error messages
      if (newToast.type === 'relinked' || newToast.type === 'info') {
        setTimeout(() => {
          removeToast(newToast.id);
        }, 5000);
      } else if (newToast.type === 'suno-fallback') {
        setTimeout(() => {
          removeToast(newToast.id);
        }, 10000);
      }
    };

    window.addEventListener('brickos:audio-diagnostic', handleEvent);
    return () => {
      window.removeEventListener('brickos:audio-diagnostic', handleEvent);
    };
  }, [removeToast]);

  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Audio Stream Diagnostics"
      className="fixed bottom-36 lg:bottom-6 right-2 sm:right-6 z-50 flex flex-col gap-2.5 max-w-md w-full px-3 sm:px-0 pointer-events-none"
    >
      {toasts.map((toast) => {
        const isFallback = toast.type === 'suno-fallback';
        const isRelinked = toast.type === 'relinked';
        const isSearching = toast.type === 'searching';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 transform translate-y-0 ${
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
            {/* Header: Icon, Type Badge & Dismiss */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                {isFallback && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                {isRelinked && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                {isSearching && <Search className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />}
                {isError && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}

                <span
                  className={`text-xs font-semibold uppercase tracking-wider ${
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
                    ? 'Background Relinker'
                    : isError
                    ? 'Audio Asset 404'
                    : 'Audio Diagnostic'}
                </span>

                {toast.trackId && (
                  <span className="text-xs font-mono text-slate-400">
                    · {toast.trackId}
                  </span>
                )}
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-200 transition p-1 -mr-1 rounded-md"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Message Body */}
            <div className="mt-2 text-xs leading-relaxed text-slate-200">
              <p className="font-medium text-slate-100">{toast.message}</p>
              {toast.originalPath && (
                <p className="mt-1 text-[11px] font-mono text-slate-400 truncate" title={toast.originalPath}>
                  Path: {toast.originalPath}
                </p>
              )}
              {toast.details && (
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {toast.details}
                </p>
              )}
            </div>

            {/* Actions for Fallback or 404 */}
            {(isFallback || isError) && (
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRelink(toast)}
                    disabled={isRelinking[toast.id]}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {isRelinking[toast.id] ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Search className="w-3 h-3" />
                    )}
                    <span>Auto-Relink Asset</span>
                  </button>

                  {onOpenWebDavExplorer && (
                    <button
                      onClick={() => {
                        onOpenWebDavExplorer(toast.originalPath ? toast.originalPath.substring(0, toast.originalPath.lastIndexOf('/')) : undefined);
                        removeToast(toast.id);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Folder className="w-3 h-3" />
                      <span>Locate</span>
                    </button>
                  )}
                </div>

                {isFallback && (
                  <span className="text-[10px] text-amber-300/80 flex items-center gap-1">
                    <Music className="w-3 h-3" />
                    Authentic Studio Take
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
};
