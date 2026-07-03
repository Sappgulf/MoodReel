import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryText = 'Try Again',
  secondaryAction,
}) {
  return (
    <div className="error-state" role="alert">
      <div className="error-state-icon" aria-hidden="true">
        <AlertTriangle size={40} strokeWidth={1.5} />
      </div>
      <div className="error-state-content">
        <h3>{title}</h3>
        {message && <p>{message}</p>}
        <div className="error-state-actions">
          {onRetry && (
            <button className="primary-button" onClick={onRetry}>
              {retryText}
            </button>
          )}
          {secondaryAction ? (
            secondaryAction.to ? (
              <Link to={secondaryAction.to} className="btn-secondary">
                {secondaryAction.label}
              </Link>
            ) : (
              <button type="button" className="btn-secondary" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </button>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default React.memo(ErrorState);
