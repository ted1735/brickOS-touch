import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Folder,
  Globe,
  HardDrive,
  Key,
  Lock,
  Music,
  Network,
  Radio,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Unlock,
  Wifi,
  WifiOff,
  X,
  Zap
} from 'lucide-react';
import { getSavedNextcloudConfig, saveNextcloudConfig } from '../data/nextcloudFolderAssets';
import { NextcloudLogEntry } from '../types';

interface EndpointProbe {
  label: string;
  baseUrl: string;
  hostname: string;
  port: number;
  isIpAddress: boolean;
  isPrivateTailscaleIp: boolean;
  dns: { ok: boolean; resolvedIp: string | null; family: number | null; error: string | null };
  tcp: { ok: boolean; latencyMs: number; error: string | null; errorCode: string | null };
  httpHead: {
    ok: boolean;
    status: number;
    statusText: string;
    serverHeader: string;
    location: string;
    latencyMs: number;
    error: string | null;
  };
  webdavPropfind: {
    ok: boolean;
    status: number;
    statusText: string;
    latencyMs: number;
    sabreException: string;
    sabreMessage: string;
    itemCount: number;
    visibleFolders: string[];
    visibleFiles: string[];
    error: string | null;
  };
  overallStatus: 'connected' | 'auth_required' | 'http_error' | 'unreachable';
  verdict: string;
  totalLatencyMs: number;
}

interface DiagnoseResponse {
  success: boolean;
  scannedAt: string;
  latencyMs: number;
  runtime: {
    tailscaleBinaryInstalled: boolean;
    tailscaleDaemonRunning: boolean;
    tailscaleProxyListening: boolean;
    tailscaleBackendState: string;
    tailscaleNote: string;
    notifyPushConnected: boolean;
    activeRoute: string;
    configuredServerUrl: string;
    configuredUsername: string;
    hasStoredPassword: boolean;
    passwordLength: number;
  };
  endpoints: EndpointProbe[];
  canSee: {
    workingEndpoint: string | null;
    workingLabel: string | null;
    reachableCount: number;
    reachableEndpoints: Array<{ label: string; baseUrl: string; status: number; latencyMs: number; overallStatus: string }>;
    visiblePath: string;
    visibleFoldersCount: number;
    visibleFilesCount: number;
    visibleFolders: string[];
    visibleFiles: string[];
  };
  cannotSee: Array<{
    label: string;
    baseUrl: string;
    stageFailed: string;
    reason: string;
    fixHint: string;
  }>;
  logs: NextcloudLogEntry[];
}

interface NextcloudConnectionDebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
  onAppliedServerUrl?: (newUrl: string) => void;
}

export const NextcloudConnectionDebugModal: React.FC<NextcloudConnectionDebugModalProps> = ({
  isOpen,
  onClose,
  isDarkMode = true,
  onAppliedServerUrl
}) => {
  const [serverUrlInput, setServerUrlInput] = useState<string>('');
  const [usernameInput, setUsernameInput] = useState<string>('ncted');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [diag, setDiag] = useState<DiagnoseResponse | null>(null);
  const [scanError, setScanError] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string>('');

  const showNotice = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const runVisibilityScan = async (overrideUrl?: string, overrideUser?: string, overridePass?: string) => {
    setIsScanning(true);
    setScanError('');
    try {
      const cfg = getSavedNextcloudConfig();
      const targetUrl = (overrideUrl !== undefined ? overrideUrl : serverUrlInput || cfg.serverUrl || '').trim();
      const targetUser = (overrideUser !== undefined ? overrideUser : usernameInput || cfg.username || 'ncted').trim();
      const targetPass = (overridePass !== undefined ? overridePass : passwordInput || cfg.appPassword || '').trim();

      const res = await fetch('/api/nextcloud/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverUrl: targetUrl,
          username: targetUser,
          password: targetPass
        })
      });
      const data: DiagnoseResponse = await res.json();
      setDiag(data);
    } catch (err: any) {
      setScanError(err?.message || 'Failed to run server visibility diagnostic');
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const cfg = getSavedNextcloudConfig();
    setServerUrlInput(cfg.serverUrl || 'https://nextcloud.mermaid-symmetric.ts.net');
    setUsernameInput(cfg.username || 'ncted');
    setPasswordInput(cfg.appPassword || '');
    runVisibilityScan(cfg.serverUrl, cfg.username, cfg.appPassword);
  }, [isOpen]);

  const handleSaveAndApply = async (targetUrlToApply?: string) => {
    const finalUrl = (targetUrlToApply ?? serverUrlInput).trim();
    if (!finalUrl) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/nextcloud/save-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverUrl: finalUrl,
          username: usernameInput.trim() || 'ncted',
          password: passwordInput.trim()
        })
      });
      const data = await res.json();
      const normalizedUrl = data.serverUrl || finalUrl;
      setServerUrlInput(normalizedUrl);

      const current = getSavedNextcloudConfig();
      saveNextcloudConfig({
        ...current,
        serverUrl: normalizedUrl,
        username: usernameInput.trim() || 'ncted',
        appPassword: passwordInput.trim() || current.appPassword
      });

      if (onAppliedServerUrl) {
        onAppliedServerUrl(normalizedUrl);
      }
      showNotice(`Saved Nextcloud target: ${normalizedUrl}`);
      await runVisibilityScan(normalizedUrl);
    } catch (err: any) {
      showNotice(`Save error: ${err?.message || 'failed'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className={`w-full max-w-4xl sm:rounded-2xl rounded-t-3xl border shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden ${
          isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* HEADER */}
        <div
          className={`p-4 border-b flex items-center justify-between gap-3 ${
            isDarkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                diag?.success
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              <Network className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm sm:text-base tracking-tight">
                  Nextcloud & Tailscale Visibility Debugger
                </h3>
                {diag && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                      diag.success
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {diag.success ? `VERIFIED (${diag.latencyMs}ms)` : 'ISSUES DETECTED'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate">
                Live server-side probe showing exactly what this app can and cannot reach
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => runVisibilityScan()}
              disabled={isScanning}
              className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer min-h-[40px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isScanning ? 'Scanning...' : 'Re-Scan All'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Close debugger"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {toastMsg && (
          <div className="bg-indigo-600 text-white text-xs font-bold py-1.5 px-4 text-center">
            {toastMsg}
          </div>
        )}

        {/* SCROLLABLE BODY */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          {/* TARGET URL / IP & CREDENTIALS EDITOR */}
          <div
            className={`p-3.5 rounded-2xl border space-y-3 ${
              isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5" />
                <span>Target Server URL or IP Address</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setServerUrlInput('https://nextcloud.mermaid-symmetric.ts.net')}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-mono border border-slate-700 cursor-pointer"
                >
                  Use *.ts.net (Funnel)
                </button>
                <button
                  type="button"
                  onClick={() => setServerUrlInput('https://nextcloud.moyercloud.com')}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-mono border border-slate-700 cursor-pointer"
                >
                  Use moyercloud.com
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
              <div className="md:col-span-5">
                <label className="block text-[10px] font-mono text-slate-400 mb-1">Server URL or IP (e.g. 100.x.y.z or https://...)</label>
                <input
                  type="text"
                  value={serverUrlInput}
                  onChange={(e) => setServerUrlInput(e.target.value)}
                  placeholder="https://nextcloud.mermaid-symmetric.ts.net or 100.x.y.z"
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-cyan-500 min-h-[42px] ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-[10px] font-mono text-slate-400 mb-1">WebDAV User</label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="ncted"
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-cyan-500 min-h-[42px] ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-[10px] font-mono text-slate-400 mb-1">App Password (leave blank to use server cached)</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Nextcloud App Password"
                    className={`w-full px-3 py-2 pr-9 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-cyan-500 min-h-[42px] ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => runVisibilityScan()}
                disabled={isScanning}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer min-h-[42px]"
              >
                <Radio className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Probing Network...' : 'Test What Server Can See'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveAndApply()}
                disabled={isSaving || !serverUrlInput.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer min-h-[42px]"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save URL & Credentials'}</span>
              </button>
            </div>
          </div>

          {scanError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{scanError}</span>
            </div>
          )}

          {isScanning && !diag && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
              <p className="text-xs font-mono">Probing DNS, TCP ports, TLS, Tailscale runtime & WebDAV /Music-Production...</p>
            </div>
          )}

          {diag && (
            <>
              {/* SECTION 1: TAILSCALE & CONTAINER RUNTIME */}
              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  diag.runtime.tailscaleDaemonRunning
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-amber-950/20 border-amber-500/30'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {diag.runtime.tailscaleDaemonRunning ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                    )}
                    <h4 className="text-xs font-black uppercase tracking-wider">
                      Tailscale & Container Network Layer
                    </h4>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                      diag.runtime.tailscaleDaemonRunning
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {diag.runtime.tailscaleBinaryInstalled
                      ? diag.runtime.tailscaleDaemonRunning
                        ? 'Tailscale Daemon Active'
                        : 'Tailscale Stopped'
                      : 'No Local Tailscale Binary in Cloud Container'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{diag.runtime.tailscaleNote}</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[9px] text-slate-500 block uppercase">Tailscale CLI</span>
                    <span className={diag.runtime.tailscaleBinaryInstalled ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                      {diag.runtime.tailscaleBinaryInstalled ? 'Installed' : 'Not Installed'}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[9px] text-slate-500 block uppercase">Proxy :1055</span>
                    <span className={diag.runtime.tailscaleProxyListening ? 'text-emerald-400 font-bold' : 'text-slate-400 font-bold'}>
                      {diag.runtime.tailscaleProxyListening ? 'Listening' : 'Offline'}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[9px] text-slate-500 block uppercase">Stored Auth</span>
                    <span className={diag.runtime.hasStoredPassword ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {diag.runtime.hasStoredPassword ? `Active (${diag.runtime.passwordLength} chars)` : 'Missing'}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[9px] text-slate-500 block uppercase">notify_push WS</span>
                    <span className={diag.runtime.notifyPushConnected ? 'text-emerald-400 font-bold' : 'text-slate-400 font-bold'}>
                      {diag.runtime.notifyPushConnected ? 'Connected' : 'Standby'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: WHAT IT CAN SEE VS CANNOT SEE */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* CAN SEE */}
                <div className="p-4 rounded-2xl border bg-emerald-950/20 border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-wider">
                      <Wifi className="w-4 h-4" />
                      <span>What Server CAN See</span>
                    </div>
                    {diag.canSee.workingEndpoint && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                        {diag.canSee.visibleFoldersCount} folders · {diag.canSee.visibleFilesCount} files
                      </span>
                    )}
                  </div>

                  {diag.canSee.workingEndpoint ? (
                    <div className="space-y-3">
                      <div className="p-2.5 rounded-xl bg-slate-950/70 border border-emerald-500/30 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[10px] font-mono text-emerald-400 uppercase">{diag.canSee.workingLabel}</div>
                          <div className="text-xs font-mono text-white truncate">{diag.canSee.workingEndpoint}</div>
                        </div>
                        {diag.canSee.workingEndpoint !== diag.runtime.configuredServerUrl && (
                          <button
                            type="button"
                            onClick={() => handleSaveAndApply(diag.canSee.workingEndpoint!)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[11px] font-bold shrink-0 cursor-pointer"
                          >
                            Switch To This
                          </button>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <div className="text-[10px] font-mono text-slate-400 uppercase">
                          Live Folders Seen in {diag.canSee.visiblePath}:
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                          {diag.canSee.visibleFolders.map((folder) => (
                            <span
                              key={folder}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-[10px] font-mono text-cyan-300"
                            >
                              <Folder className="w-3 h-3 text-cyan-400" />
                              <span>{folder}</span>
                            </span>
                          ))}
                          {diag.canSee.visibleFiles.slice(0, 12).map((file) => (
                            <span
                              key={file}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-emerald-300"
                            >
                              <Music className="w-3 h-3 text-emerald-400" />
                              <span>{file}</span>
                            </span>
                          ))}
                          {diag.canSee.visibleFolders.length === 0 && diag.canSee.visibleFiles.length === 0 && (
                            <span className="text-[11px] text-slate-500 font-mono">Folder accessible (0 child entries returned)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-xs text-slate-400 space-y-2">
                      <p>No WebDAV endpoint returned HTTP 207 Multi-Status yet.</p>
                      {diag.canSee.reachableEndpoints.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-[10px] font-mono text-amber-300 uppercase">TCP/HTTP Reachable (Needs Auth/Path Fix):</div>
                          {diag.canSee.reachableEndpoints.map((ep) => (
                            <div key={ep.baseUrl} className="text-[11px] font-mono text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                              {ep.baseUrl} → HTTP {ep.status} ({ep.latencyMs}ms)
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* CANNOT SEE */}
                <div className="p-4 rounded-2xl border bg-rose-950/15 border-rose-500/30 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-rose-400 font-black text-xs uppercase tracking-wider">
                      <WifiOff className="w-4 h-4" />
                      <span>What Server CANNOT See</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 text-[10px] font-mono font-bold">
                      {diag.cannotSee.length} blocked
                    </span>
                  </div>

                  {diag.cannotSee.length > 0 ? (
                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {diag.cannotSee.map((item) => (
                        <div key={item.baseUrl} className="p-2.5 rounded-xl bg-slate-950/75 border border-rose-500/30 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-mono font-bold text-rose-300 truncate">{item.baseUrl}</span>
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-200 text-[9px] font-mono shrink-0">
                              {item.stageFailed}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-snug">{item.reason}</p>
                          <p className="text-[10px] font-mono text-amber-300/90 leading-snug">Fix: {item.fixHint}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-emerald-300 font-mono">
                      All probed Nextcloud endpoints are reachable and authenticated!
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3: STEP-BY-STEP PROBE PIPELINE PER ENDPOINT */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Hop-by-Hop Probe Matrix ({diag.endpoints.length} endpoints tested)</span>
                </div>

                <div className="space-y-2.5">
                  {diag.endpoints.map((ep) => (
                    <div
                      key={ep.baseUrl}
                      className={`p-3.5 rounded-2xl border space-y-2.5 ${
                        ep.overallStatus === 'connected'
                          ? 'bg-slate-950/70 border-emerald-500/40'
                          : ep.overallStatus === 'auth_required'
                          ? 'bg-slate-950/70 border-amber-500/40'
                          : 'bg-slate-950/70 border-rose-500/30'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white">{ep.label}</span>
                            <span className="text-[11px] font-mono text-cyan-400 truncate">{ep.baseUrl}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{ep.verdict}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono text-slate-400">{ep.totalLatencyMs}ms</span>
                          {ep.overallStatus === 'connected' && (
                            <button
                              type="button"
                              onClick={() => handleSaveAndApply(ep.baseUrl)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[10px] font-bold cursor-pointer"
                            >
                              Use Endpoint
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 4 Pipeline Steps */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
                        <div className={`p-2 rounded-xl border ${ep.dns.ok ? 'bg-emerald-950/30 border-emerald-700/40 text-emerald-300' : 'bg-rose-950/30 border-rose-700/40 text-rose-300'}`}>
                          <div className="font-bold uppercase">1. DNS</div>
                          <div className="truncate mt-0.5">{ep.dns.ok ? ep.dns.resolvedIp : ep.dns.error || 'Failed'}</div>
                        </div>

                        <div className={`p-2 rounded-xl border ${ep.tcp.ok ? 'bg-emerald-950/30 border-emerald-700/40 text-emerald-300' : 'bg-rose-950/30 border-rose-700/40 text-rose-300'}`}>
                          <div className="font-bold uppercase">2. TCP :{ep.port}</div>
                          <div className="truncate mt-0.5">{ep.tcp.ok ? `Open (${ep.tcp.latencyMs}ms)` : ep.tcp.errorCode || 'Blocked'}</div>
                        </div>

                        <div className={`p-2 rounded-xl border ${ep.httpHead.ok ? 'bg-emerald-950/30 border-emerald-700/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                          <div className="font-bold uppercase">3. HTTPS/HTTP</div>
                          <div className="truncate mt-0.5">
                            {ep.httpHead.status ? `HTTP ${ep.httpHead.status} (${ep.httpHead.serverHeader || 'edge'})` : ep.httpHead.error || 'Skipped'}
                          </div>
                        </div>

                        <div
                          className={`p-2 rounded-xl border ${
                            ep.webdavPropfind.ok
                              ? 'bg-emerald-950/30 border-emerald-700/40 text-emerald-300'
                              : ep.webdavPropfind.status === 401
                              ? 'bg-amber-950/30 border-amber-700/40 text-amber-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="font-bold uppercase">4. WebDAV 207</div>
                          <div className="truncate mt-0.5">
                            {ep.webdavPropfind.ok
                              ? `HTTP ${ep.webdavPropfind.status} (${ep.webdavPropfind.itemCount} items)`
                              : ep.webdavPropfind.status
                              ? `HTTP ${ep.webdavPropfind.status} ${ep.webdavPropfind.sabreException || ''}`
                              : ep.webdavPropfind.error || 'Skipped'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 4: SERVER LOG TAIL */}
              {diag.logs && diag.logs.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Live Server Connection Trace ({diag.logs.length} recent events)</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 max-h-48 overflow-y-auto space-y-1.5 font-mono text-[10px]">
                    {diag.logs.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-2 border-b border-slate-900 pb-1 last:border-0">
                        <span
                          className={`px-1.5 py-0.2 rounded shrink-0 font-bold ${
                            entry.level === 'success'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : entry.level === 'warn'
                              ? 'bg-amber-500/20 text-amber-300'
                              : entry.level === 'error'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {entry.stage}
                        </span>
                        <span className="text-slate-300 leading-snug">{entry.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER */}
        <div
          className={`p-3.5 border-t flex items-center justify-between text-xs ${
            isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <span className="text-[11px] text-slate-400 font-mono truncate">
            Active Path: {diag?.canSee.visiblePath || '/remote.php/dav/files/ncted/Music-Production'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
