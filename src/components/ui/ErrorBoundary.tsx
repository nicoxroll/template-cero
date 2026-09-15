import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';
import LogoMark from './LogoMark';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled runtime error in React component tree:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-screen w-full bg-brand-900 text-white flex items-center justify-center p-6 relative overflow-hidden"
        >
          {/* Velo de marca sutil */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90 pointer-events-none" />

          <div className="relative z-10 max-w-lg w-full text-center border border-white/10 bg-white/5 backdrop-blur-md p-8 sm:p-12 shadow-2xl">
            <div className="flex justify-center mb-6">
              <LogoMark tone="current" className="h-10 w-auto text-brand-300" />
            </div>

            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/20 text-amber-300 mb-6 border border-amber-500/30">
              <AlertTriangle className="w-6 h-6" strokeWidth={1.5} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-light uppercase tracking-wider text-white mb-3">
              Ocurrió un error inesperado
            </h1>

            <p className="text-sm font-light text-white/80 leading-relaxed mb-8">
              Disculpe las molestias. Se produjo un error temporal en la aplicación. Puede
              intentar recargar la página o regresar al inicio.
            </p>

            {this.state.error && import.meta.env.DEV && (
              <pre className="mb-6 p-3 text-left text-xs bg-black/50 text-red-300 rounded border border-red-500/30 overflow-x-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium uppercase tracking-widest transition-colors duration-300 shadow-md focus-ring cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recargar página</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/30 hover:border-white text-white text-xs font-medium uppercase tracking-widest transition-colors duration-300 focus-ring cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Ir al inicio</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
