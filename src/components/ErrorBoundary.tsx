import React, { Component, ErrorInfo, ReactNode } from 'react';

export class ErrorBoundary extends Component<{children: ReactNode, fallback?: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className='p-8 text-center text-red-500'>
          <h1 className='text-xl font-bold mb-4'>Something went wrong loading this view.</h1>
          <pre className='text-left bg-red-50 p-4 rounded-xl text-xs overflow-auto'>{this.state.error?.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
