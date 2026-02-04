import React from 'react';

function ErrorState({ title = 'Something went wrong', message, onRetry }) {
    return (
        <div className="error-state" role="alert">
            <div className="error-state-content">
                <h3>{title}</h3>
                {message && <p>{message}</p>}
                {onRetry && (
                    <button className="primary-button" onClick={onRetry}>
                        Try Again
                    </button>
                )}
            </div>
        </div>
    );
}

export default React.memo(ErrorState);
