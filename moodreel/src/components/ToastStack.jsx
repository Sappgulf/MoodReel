import React from 'react';
import { useToasts } from '../context/ToastContext';

function ToastStack() {
    const { toasts, dismissToast } = useToasts();
    if (!toasts || toasts.length === 0) return null;

    return (
        <div
            className="toast-stack"
            aria-live="polite"
            aria-relevant="additions removals"
        >
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`toast ${toast.variant ? `toast-${toast.variant}` : ''}`}
                    role="status"
                    onClick={() => dismissToast(toast.id)}
                >
                    <div className="toast-icon" aria-hidden="true">{toast.icon || '✅'}</div>
                    <div className="toast-content">
                        {toast.label && <p className="toast-label">{toast.label}</p>}
                        {toast.title && <h4 className="toast-title">{toast.title}</h4>}
                        {toast.message && <p className="toast-description">{toast.message}</p>}
                    </div>
                    <button
                        className="toast-dismiss"
                        type="button"
                        aria-label="Dismiss"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            dismissToast(toast.id);
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
