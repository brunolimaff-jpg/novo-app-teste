import React, { Component, ErrorInfo, ReactNode } from 'react';
import type { AppError } from '../../types';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.componentName ? `:${this.props.componentName}` : ''}]`, error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 min-h-[200px] text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Algo deu errado
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-md">
            {this.state.error?.message || 'Ocorreu um erro inesperado. Tente novamente.'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook para criar error boundaries funcionais
interface UseErrorBoundaryReturn {
  ErrorBoundaryWrapper: React.FC<{ children: ReactNode }>;
  error: Error | null;
  reset: () => void;
}

export function useErrorBoundary(componentName?: string): UseErrorBoundaryReturn {
  const [error, setError] = React.useState<Error | null>(null);

  const reset = React.useCallback(() => {
    setError(null);
  }, []);

  const ErrorBoundaryWrapper = React.useCallback(
    ({ children }: { children: ReactNode }) => (
      <ErrorBoundary
        componentName={componentName}
        onError={(err) => setError(err)}
      >
        {children}
      </ErrorBoundary>
    ),
    [componentName]
  );

  return { ErrorBoundaryWrapper, error, reset };
}
