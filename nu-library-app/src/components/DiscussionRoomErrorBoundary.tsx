import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** Keep a room-screen rendering error from leaving the native WebView blank. */
export class DiscussionRoomErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Discussion rooms screen failed to render:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-white" role="alert">
          <h2 className="text-base font-semibold">Discussion rooms could not be displayed</h2>
          <p className="mt-2 text-sm text-gray-400">Your request is still saved. Reload the app to try again.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-[#8A151B] px-4 py-2 text-sm font-semibold"
          >
            Reload app
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
