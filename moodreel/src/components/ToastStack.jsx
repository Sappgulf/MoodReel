import React, { useCallback, useState } from 'react';
import { useToasts } from '../context/ToastContext';

function ToastStack() {
  const { toasts, dismissToast } = useToasts();
  const [exitingIds, setExitingIds] = useState(() => new Set());

  const handleDismiss = useCallback(
    id => {
      setExitingIds(prev => new Set(prev).add(id));
      window.setTimeout(() => {
        dismissToast(id);
        setExitingIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 280);
    },
    [dismissToast]
  );

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-stack" aria-live="polite" aria-relevant="additions removals">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast ${toast.variant ? `toast-${toast.variant}` : ''} ${exitingIds.has(toast.id) ? 'toast-exit' : ''}`}
          role="status"
          style={toast.duration ? { '--toast-duration': `${toast.duration}ms` } : undefined}
        >
          <div className="toast-icon" aria-hidden="true">
            {toast.icon || '✅'}
          </div>
          <div className="toast-content">
            {toast.label && <p className="toast-label">{toast.label}</p>}
            {toast.title && <h4 className="toast-title">{toast.title}</h4>}
            {toast.message && <p className="toast-description">{toast.message}</p>}
          </div>
          <button
            className="toast-dismiss"
            type="button"
            aria-label={`Dismiss ${toast.title || 'notification'}`}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              handleDismiss(toast.id);
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

export default React.memo(ToastStack);
