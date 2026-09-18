import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Erro capturado na renderização:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-base font-bold text-white">Ops, algo deu errado ao carregar</h2>
              <p className="text-xs text-slate-400 mt-1">
                O aplicativo encontrou uma falha temporária de inicialização. Tente recarregar a página.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <p className="text-[11px] font-mono text-rose-300 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recarregar Página</span>
              </button>
              <button
                type="button"
                onClick={this.handleResetCache}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Cache</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
