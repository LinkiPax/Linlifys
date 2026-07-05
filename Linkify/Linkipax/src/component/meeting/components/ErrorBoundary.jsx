import React from "react";

export default class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("MeetingApp Error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong with the video call.</h2>
          <p>
            {this.state.error?.message || "Unknown error occurred"}
          </p>
          <div className="error-actions">
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Refresh Page
            </button>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="btn btn-secondary"
            >
              Try Again
            </button>
          </div>
          {process.env.NODE_ENV === "development" && (
            <details className="error-details">
              <summary>Error Details</summary>
              <pre>
                {this.state.error?.stack}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
