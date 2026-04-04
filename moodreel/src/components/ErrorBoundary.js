import React, { Component } from 'react';
import { Link } from 'react-router-dom';

export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            const { fallback, variant = 'default' } = this.props;

            if (fallback) {
                return fallback({ error: this.state.error, reset: this.handleReset });
            }

            const content = {
                default: {
                    icon: '🎬',
                    title: 'Something went wrong',
                    message: "We couldn't load this content. Please try again.",
                    showHome: true
                },
                page: {
                    icon: '📄',
                    title: 'Page Error',
                    message: 'This page encountered an error. Try refreshing.',
                    showHome: true
                },
                widget: {
                    icon: '⚙️',
                    title: 'Component Error',
                    message: 'This component failed to load.',
                    showHome: false
                },
                critical: {
                    icon: '🚨',
                    title: 'Critical Error',
                    message: 'A critical error occurred. Please refresh the page.',
                    showHome: true
                }
            };

            const config = content[variant] || content.default;

            return (
                <div className={`error-boundary error-boundary--${variant}`}>
                    <div className="error-boundary-content">
                        <div className="error-icon">{config.icon}</div>
                        <h2>{config.title}</h2>
                        <p>{config.message}</p>
                        <div className="error-actions">
                            <button
                                className="primary-button"
                                onClick={this.handleReset}
                            >
                                Try Again
                            </button>
                            {config.showHome && (
                                <Link to="/" className="back-button" onClick={this.handleReset}>
                                    ← Back to Discover
                                </Link>
                            )}
                        </div>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="error-details">
                                <summary>Error Details</summary>
                                <pre>{this.state.error.toString()}</pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export function withErrorBoundary(Component, fallback) {
    return function WrappedComponent(props) {
        return (
            <ErrorBoundary fallback={fallback}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
}

export default ErrorBoundary;
