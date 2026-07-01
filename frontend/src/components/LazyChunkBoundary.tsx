import { Component, type ErrorInfo, type ReactNode } from 'react';

type LazyChunkBoundaryProps = {
  children: ReactNode;
  label?: string;
};

type LazyChunkBoundaryState = {
  error: Error | null;
};

export class LazyChunkBoundary extends Component<LazyChunkBoundaryProps, LazyChunkBoundaryState> {
  state: LazyChunkBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Lazy chunk failed to load', error, errorInfo);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-100">
        <p className="font-semibold">{this.props.label ?? 'This section'} could not load.</p>
        <p className="mt-1 text-rose-100/80">Refresh the page to retry the lazy-loaded bundle.</p>
        <button className="mt-3 rounded-xl border border-rose-200/20 bg-rose-200/10 px-3 py-1.5 text-xs font-semibold" onClick={() => window.location.reload()}>
          Refresh
        </button>
      </div>
    );
  }
}
