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

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    // Redirect to login on error
    setTimeout(() => {
      window.location.href = "/login";
    }, 100);
  }

  render() {
    if (this.state.hasError) {
      // Silently redirect, don't show error UI
      setTimeout(() => {
        window.location.href = "/login";
      }, 100);
      return null;
    }

    return this.props.children;
  }
}
