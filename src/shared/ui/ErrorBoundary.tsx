import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center bg-surface">
          <div className="w-12 h-12 rounded-full bg-warning-soft flex items-center justify-center mb-4">
            <AlertTriangle size={24} className="text-warning" strokeWidth={1.8} />
          </div>
          <p className="text-lg font-semibold text-text mb-1">Something went wrong</p>
          <p className="text-sm text-text-secondary mb-4">Please try again</p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="text-xs text-danger bg-danger-soft rounded-xl p-3 mb-4 max-w-full overflow-auto text-left select-text whitespace-pre-wrap break-words">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={this.handleRetry}
              className="px-6 py-2.5 text-sm font-semibold text-[#2C3400] bg-primary rounded-xl transition-all duration-150 active:scale-95"
            >
              Try again
            </button>
            <button
              onClick={this.handleReload}
              className="px-6 py-2.5 text-sm font-semibold text-text bg-surface-muted rounded-xl transition-all duration-150 active:scale-95"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
