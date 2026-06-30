import React, { useCallback } from 'react';
import { useModalDialog } from '../hooks/useModalDialog';

/**
 * Lightweight confirm/prompt dialog supporting both modal styles:
 *  - mode="confirm": title + message + Confirm/Cancel buttons
 *  - mode="prompt": title + message + text input + Submit/Cancel
 *
 * Designed as a drop-in replacement for window.confirm / window.prompt
 * so call sites can stay synchronous-ish by gating with a state value.
 */
function ConfirmDialog({
  isOpen,
  mode = 'confirm',
  title = 'Are you sure?',
  message = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  initialValue = '',
  placeholder = '',
  destructive = false,
  onConfirm,
  onCancel,
}) {
  const [value, setValue] = React.useState(initialValue);
  const { dialogRef, focusRef } = useModalDialog({ isOpen });
  const inputRef = React.useRef(null);
  React.useEffect(() => {
    if (isOpen && mode === 'prompt' && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen, mode]);

  React.useEffect(() => {
    if (isOpen) setValue(initialValue);
  }, [isOpen, initialValue]);

  const handleConfirm = useCallback(() => {
    if (mode === 'prompt') {
      onConfirm?.(value);
    } else {
      onConfirm?.();
    }
  }, [mode, onConfirm, value]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const handleSubmit = useCallback(
    e => {
      e.preventDefault();
      handleConfirm();
    },
    [handleConfirm]
  );

  const handleKeyDown = useCallback(
    e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleCancel]
  );

  if (!isOpen) return null;

  return (
    <div
      className="confirm-dialog-backdrop"
      data-app-modal="true"
      onClick={e => {
        if (e.target === e.currentTarget) handleCancel();
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={dialogRef}
        className={`confirm-dialog ${destructive ? 'destructive' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <h3 className="confirm-dialog-title">{title}</h3>
        {message && <p className="confirm-dialog-message">{message}</p>}

        {mode === 'prompt' && (
          <form onSubmit={handleSubmit} className="confirm-dialog-form">
            <input
              ref={inputRef}
              type="text"
              className="confirm-dialog-input"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={placeholder}
              maxLength={72}
              aria-label={title}
            />
            <div className="confirm-dialog-actions">
              <button type="button" className="btn-secondary btn-sm" onClick={handleCancel}>
                {cancelLabel}
              </button>
              <button type="submit" className="btn-primary btn-sm" disabled={!value.trim()}>
                {confirmLabel}
              </button>
            </div>
          </form>
        )}

        {mode === 'confirm' && (
          <div className="confirm-dialog-actions">
            <button type="button" className="btn-secondary btn-sm" onClick={handleCancel}>
              {cancelLabel}
            </button>
            <button
              type="button"
              className={`btn-primary btn-sm ${destructive ? 'destructive' : ''}`}
              onClick={handleConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ConfirmDialog;
