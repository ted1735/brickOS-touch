import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Radio,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  Key,
  Globe,
  HardDrive,
  Server,
  Zap,
  ArrowRight,
  X,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Terminal
} from 'lucide-react';

interface TailscalePeer {
  id: string;
  hostname: string;
  dnsName: string;
  tailscaleIPs: string[];
  online: boolean;
  os: string;
  isNextcloudCandidate: boolean;
}

interface TailscaleStatusData {
  success: boolean;
  isInstalled: boolean;
  isDaemonRunning: boolean;
  backendState: 'Running' | 'NeedsLogin' | 'Stopped' | 'NoState' | 'Starting' | string;
  authUrl: string | null;
  tailscaleIPs: string[];
  selfNode: {
    hostname: string;
    dnsName: string;
    online: boolean;
    tailscaleIPs: string[];
  };
  peers: TailscalePeer[];
  proxy: {
    http: string;
    socks5: string;
    active: boolean;
  };
  currentTailnet?: string | null;
  error?: string;
}

interface TailscaleVpnModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
  onSelectNextcloudHost?: (hostUrl: string) => void;
}

export const TailscaleVpnModal: React.FC<TailscaleVpnModalProps> = ({
  isOpen,
  onClose,
  isDarkMode = true,
  onSelectNextcloudHost
}) => {
  const [status, setStatus] = useState<TailscaleStatusData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authKeyInput, setAuthKeyInput] = useState<string>('');
  const [isConnectingKey, setIsConnectingKey] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string>('');
  const [pingTarget, setPingTarget] = useState<string>('');
  const [pingResult, setPingResult] = useState<{ success: boolean; latencyMs?: number; message?: string } | null>(null);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'status' | 'peers' | 'auth'>('status');

  const showCopied = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedText(`Copied ${label}!`);
    setTimeout(() => setCopiedText(''), 2500);
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/tailscale/status');
      const data: TailscaleStatusData = await res.json();
      setStatus(data);
    } catch (err: any) {
      console.warn('Failed to fetch Tailscale status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Poll status every 3 seconds when open to catch login completion
  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    fetchStatus();

    const interval = setInterval(fetchStatus, 3500);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleConnectAuthKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authKeyInput.trim()) return;

    setIsConnectingKey(true);
    try {
      const res = await fetch('/api/tailscale/up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authKey: authKeyInput.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setAuthKeyInput('');
        fetchStatus();
      } else {
        alert(data.error || 'Failed to authenticate with Tailscale Auth Key');
      }
    } catch (err: any) {
      alert(`Connection error: ${err.message}`);
    } finally {
      setIsConnectingKey(false);
    }
  };

  const handleRefreshLoginUrl = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/tailscale/up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      fetchStatus();
    } catch (err: any) {
      console.warn('Error refreshing Tailscale login URL:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to disconnect and log out of Tailscale?')) return;
    setIsLoggingOut(true);
    try {
      await fetch('/api/tailscale/logout', { method: 'POST' });
      fetchStatus();
    } catch (err: any) {
      console.warn('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handlePing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pingTarget.trim()) return;

    setIsPinging(true);
    setPingResult(null);
    try {
      const res = await fetch('/api/tailscale/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetHost: pingTarget.trim() })
      });
      const data = await res.json();
      setPingResult(data);
    } catch (err: any) {
      setPingResult({ success: false, message: err.message });
    } finally {
      setIsPinging(false);
    }
  };

  if (!isOpen) return null;

  const isConnected = status?.backendState === 'Running';
  const needsLogin = status?.backendState === 'NeedsLogin';
  const selfIp = status?.tailscaleIPs?.[0] || status?.selfNode?.tailscaleIPs?.[0] || '';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>

        {/* HEADER */}
        <div className={`p-4 border-b flex items-center justify-between gap-3 ${
          isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${
              isConnected
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-emerald-950/50'
                : needsLogin
                ? 'bg-gradient-to-tr from-amber-600 to-orange-600 shadow-amber-950/50'
                : 'bg-slate-800 text-slate-400'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm uppercase tracking-wide">Tailscale Mesh VPN</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1.5 ${
                  isConnected
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : needsLogin
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : needsLogin ? 'bg-amber-400' : 'bg-slate-400'}`} />
                  <span>{isConnected ? 'Connected & Active' : needsLogin ? 'Needs Login' : 'Offline'}</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">v1.102.4</span>
              </div>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Userspace encrypted WireGuard mesh network connecting studio to your private Nextcloud
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchStatus}
              disabled={isLoading}
              className="p-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 transition cursor-pointer"
              title="Refresh status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TOAST PILL */}
        {copiedText && (
          <div className="bg-indigo-600 text-white text-xs font-bold py-1 px-4 text-center">
            {copiedText}
          </div>
        )}

        {/* TABS */}
        <div className={`flex items-center gap-1 px-4 py-2 border-b text-xs font-bold ${
          isDarkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-100/60 border-slate-200'
        }`}>
          <button
            onClick={() => setActiveTab('status')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'status'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Connection Status
          </button>
          <button
            onClick={() => setActiveTab('peers')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'peers'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Tailnet Devices</span>
            {status?.peers && status.peers.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-cyan-300 font-mono">
                {status.peers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('auth')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'auth'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Auth Key / Settings
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">

          {/* TAB 1: CONNECTION STATUS */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* CONNECTED STATE */}
              {isConnected && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Studio Node Connected to Tailnet</span>
                    </div>
                    {status?.currentTailnet && (
                      <span className="text-[11px] font-mono text-emerald-300">
                        Tailnet: {status.currentTailnet}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 block uppercase">Node Hostname</span>
                      <span className="text-white font-bold">{status.selfNode?.hostname || 'brickos-studio'}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 block uppercase">Tailscale IP</span>
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-400 font-bold">{selfIp || '100.x.x.x'}</span>
                        {selfIp && (
                          <button
                            onClick={() => showCopied(selfIp, 'Tailscale IP')}
                            className="p-1 text-slate-400 hover:text-white"
                            title="Copy IP"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {status.selfNode?.dnsName && (
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">MagicDNS Address</span>
                        <span className="text-indigo-300">{status.selfNode.dnsName}</span>
                      </div>
                      <button
                        onClick={() => showCopied(status.selfNode.dnsName, 'MagicDNS')}
                        className="p-1 text-slate-400 hover:text-white"
                        title="Copy MagicDNS"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      WebDAV requests to *.ts.net and 100.x.y.z route via proxy automatically.
                    </span>
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="px-3 py-1.5 rounded-lg border border-rose-500/40 text-rose-300 hover:bg-rose-500/20 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>{isLoggingOut ? 'Logging out...' : 'Disconnect'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ACTION REQUIRED: NEEDS LOGIN */}
              {needsLogin && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <AlertCircle className="w-4 h-4" />
                    <span>Action Required: Approve Device in Tailscale</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Tailscale is installed and running in userspace mode. Click the button below to authorize <strong className="text-white">brickos-studio</strong> into your Tailnet in your browser.
                  </p>

                  {status?.authUrl ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <a
                          href={status.authUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 transition cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Authorize Device in Tailscale</span>
                        </a>

                        <button
                          onClick={() => showCopied(status.authUrl || '', 'Login Link')}
                          className="px-3 py-2.5 rounded-xl border border-amber-500/40 text-amber-300 hover:bg-amber-500/20 text-xs font-bold transition flex items-center gap-1"
                          title="Copy login URL"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-500 font-mono text-center">
                        This modal auto-detects when authorization finishes.
                      </p>
                    </div>
                  ) : (
                    <div className="py-2">
                      <button
                        onClick={handleRefreshLoginUrl}
                        className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Generate Login URL...</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* QUICK PROBE / PING TEST TOOL */}
              <div className={`p-4 rounded-xl border space-y-3 ${
                isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <h4 className="font-bold text-xs uppercase">Probe Nextcloud over Tailscale</h4>
                </div>

                <form onSubmit={handlePing} className="flex gap-2">
                  <input
                    type="text"
                    value={pingTarget}
                    onChange={(e) => setPingTarget(e.target.value)}
                    placeholder="Enter Tailscale IP or host (e.g. 100.85.12.9 or nextcloud.tailnet.ts.net)..."
                    className={`flex-1 px-3 py-1.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={isPinging || !pingTarget.trim()}
                    className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {isPinging ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5" />}
                    <span>Test Ping</span>
                  </button>
                </form>

                {pingResult && (
                  <div className={`p-3 rounded-xl text-xs font-mono flex items-center gap-2 border ${
                    pingResult.success
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  }`}>
                    {pingResult.success ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                    <span>{pingResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TAILNET PEER DEVICES */}
          {activeTab === 'peers' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-400">
                  Detected Tailnet Machines ({status?.peers?.length || 0})
                </span>
                <span className="text-[11px] text-slate-500">
                  Click to select host for Nextcloud WebDAV
                </span>
              </div>

              {status?.peers && status.peers.length > 0 ? (
                <div className="space-y-2">
                  {status.peers.map(peer => {
                    const peerIp = peer.tailscaleIPs[0] || '';
                    return (
                      <div
                        key={peer.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                          peer.isNextcloudCandidate
                            ? 'bg-cyan-950/30 border-cyan-500/40'
                            : isDarkMode
                            ? 'bg-slate-950/60 border-slate-800'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            peer.online ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                          }`}>
                            <Server className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs truncate">{peer.hostname}</span>
                              {peer.isNextcloudCandidate && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                  Likely Nextcloud Host
                                </span>
                              )}
                              <span className={`w-1.5 h-1.5 rounded-full ${peer.online ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                            </div>
                            <p className="text-[10px] font-mono text-slate-400 truncate">
                              IP: {peerIp} · {peer.dnsName || 'No DNS'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {onSelectNextcloudHost && peerIp && (
                            <button
                              onClick={() => {
                                onSelectNextcloudHost(`http://${peerIp}`);
                                showCopied(peerIp, 'Nextcloud Host IP');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Set as Nextcloud Server in Settings"
                            >
                              <span>Use Host</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => showCopied(peerIp, 'Peer IP')}
                            className="p-1 rounded text-slate-400 hover:text-white"
                            title="Copy Tailscale IP"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 space-y-2">
                  <Server className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs">
                    {isConnected
                      ? 'No other machines detected in this Tailnet yet.'
                      : 'Connect to Tailscale above to discover your Nextcloud server and devices.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AUTH KEY / MANUAL CONFIG */}
          {activeTab === 'auth' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border space-y-3 ${
                isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2 text-indigo-400">
                  <Key className="w-4 h-4" />
                  <h4 className="font-bold text-xs uppercase">Connect with Tailscale Auth Key (Headless)</h4>
                </div>

                <p className="text-xs text-slate-400">
                  Generate an auth key in the Tailscale admin console at <a href="https://login.tailscale.com/admin/settings/keys" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">login.tailscale.com/admin/settings/keys</a> to authenticate instantly without visiting a browser URL.
                </p>

                <form onSubmit={handleConnectAuthKey} className="space-y-3">
                  <div>
                    <input
                      type="password"
                      value={authKeyInput}
                      onChange={(e) => setAuthKeyInput(e.target.value)}
                      placeholder="Paste tskey-auth-... here"
                      className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isConnectingKey || !authKeyInput.trim()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                  >
                    {isConnectingKey ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>Connect via Auth Key</span>
                  </button>
                </form>
              </div>

              {/* TECHNICAL ARCHITECTURE INFO */}
              <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/40 text-[11px] font-mono space-y-1.5 text-slate-400">
                <div className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  Environment Configuration
                </div>
                <div>• Mode: Userspace WireGuard Engine (<span className="text-cyan-400">--tun=userspace-networking</span>)</div>
                <div>• SOCKS5 Proxy: <span className="text-emerald-400">127.0.0.1:1055</span></div>
                <div>• HTTP Outbound Proxy: <span className="text-emerald-400">127.0.0.1:1055</span></div>
                <div>• WebDAV Client: Automatic routing for *.ts.net and 100.x.y.z CGNAT addresses</div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className={`p-3.5 border-t flex items-center justify-between text-xs ${
          isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Encrypted point-to-point WireGuard tunnel</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
