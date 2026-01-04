import React, { Component } from 'react';
import { Link } from 'react-router-dom';

/**
 * Error Boundary component to catch and display errors gracefully
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <div className="error-boundary-content">
                        <div className="error-icon">🎬</div>
                        <h2>Something went wrong</h2>
                        <p>We couldn't load this page. Please try again.</p>
                        <div className="error-actions">
                            <button
                                className="primary-button"
                                onClick={this.handleReset}
                            >
                                Try Again
                            </button>
                            <Link to="/" className="back-button" onClick={this.handleReset}>
                                ← Back to Discover
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
