import React from 'react';
import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import { useToasts } from '../context/ToastContext';

const variantIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

function renderToastIcon(toast) {
  if (React.isValidElement(toast.icon)) return toast.icon;
  if (typeof toast.icon === 'string' || typeof toast.icon === 'number') {
    return toast.icon;
  }
  if (toast.icon) {
    const Icon = toast.icon;
    return <Icon size={18} aria-hidden="true" />;
  }
  const VariantIcon = variantIcons[toast.variant] || CheckCircle;
  return <VariantIcon size={18} aria-hidden="true" />;
}

function ToastStack() {
  const { toasts, dismissToast } = useToasts();
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-stack" aria-live="polite" aria-relevant="additions removals">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast ${toast.variant ? `toast-${toast.variant}` : ''}`}
          role="status"
        >
          <div className="toast-icon" aria-hidden="true">
            {renderToastIcon(toast)}
          </div>
          <div className="toast-content">
            {toast.label && <p className="toast-label">{toast.label}</p>}
            {toast.title && <h4 className="toast-title">{toast.title}</h4>}
            {toast.message && <p className="toast-description">{toast.message}</p>}
            {toast.action && (
              <button
                className="toast-action"
                type="button"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  toast.action.onClick?.();
                  dismissToast(toast.id);
                }}
              >
                {toast.action.label}
              </button>
            )}
          </div>
          <button
            className="toast-dismiss"
            type="button"
            aria-label="Dismiss"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              dismissToast(toast.id);
            }}
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default React.memo(ToastStack);
