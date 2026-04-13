/* Error boundary that sends users back to login if rendering breaks. */

import React, { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  // Turns any render error into a safe fallback state.
static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  // Logs the fault and bounces the user back to sign-in.
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    // Send the user back to login.
    setTimeout(() => {
      window.location.href = "/login";
    }, 100);
  }

  // Falls back to a silent redirect rather than an error screen.
render() {
    if (this.state.hasError) {
      // Keep the user moving without showing an error page.
      setTimeout(() => {
        window.location.href = "/login";
      }, 100);
      return null;
    }

    return this.props.children;
  }
}
