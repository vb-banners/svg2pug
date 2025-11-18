import { Component, ErrorInfo, ReactNode } from 'react';

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
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-900 text-white p-4">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="mb-4 text-gray-300">
              The application encountered an error. Please try refreshing the page.
            </p>
            <div className="bg-gray-800 p-4 rounded text-left overflow-auto max-h-48 mb-4 text-sm font-mono">
              {this.state.error?.toString()}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
