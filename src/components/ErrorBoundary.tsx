import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] w-full p-8 flex items-center justify-center bg-slate-950/80 rounded-2xl border border-rose-500/30 text-slate-100 my-4 shadow-2xl">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/40">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-rose-200">
                {this.props.fallbackTitle || 'Component Encountered an Unexpected Error'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {this.state.error?.message || 'A transient rendering error occurred in this module.'}
              </p>
            </div>

            {this.state.errorInfo && (
              <details className="text-left bg-slate-900/90 rounded-lg p-3 text-[10px] font-mono text-slate-400 border border-slate-800 max-h-36 overflow-y-auto">
                <summary className="cursor-pointer font-bold text-slate-300 hover:text-white transition">
                  Component Stack Trace
                </summary>
                <pre className="mt-2 whitespace-pre-wrap text-rose-300/80">
                  {this.state.error?.stack || this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/30 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recover Component</span>
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Reload App</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
