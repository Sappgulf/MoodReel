import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useModalDialog } from '../hooks/useModalDialog';

function SaveVibeModal({ isOpen, defaultName = '', onClose, onSave }) {
  const [name, setName] = useState(defaultName);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
    }
  }, [defaultName, isOpen]);

  const handleSubmit = useCallback(
    e => {
      e.preventDefault();
      const trimmed = name.trim();
      if (!trimmed) return;
      onSave(trimmed);
    },
    [name, onSave]
  );

  const { dialogRef } = useModalDialog({
    isOpen,
    onClose,
    focusRef: inputRef,
  });

  if (!isOpen) return null;

  return (
    <div className="save-vibe-backdrop" data-app-modal="true" onMouseDown={onClose}>
      <form
        ref={dialogRef}
        className="save-vibe-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-vibe-title"
        aria-describedby="save-vibe-description"
        onSubmit={handleSubmit}
        onMouseDown={e => e.stopPropagation()}
      >
        <button type="button" className="save-vibe-close" aria-label="Close" onClick={onClose}>
          ✕
        </button>
        <p className="modal-kicker">Save this vibe</p>
        <h2 id="save-vibe-title">Name your custom discovery mix</h2>
        <p id="save-vibe-description">
          Save the current mood, genres, providers, and filters so you can replay it later.
        </p>
        <label className="save-vibe-label" htmlFor="save-vibe-name">
          Vibe name
        </label>
        <input
          ref={inputRef}
          id="save-vibe-name"
          type="text"
          value={name}
          maxLength={60}
          placeholder="Late Night Thrills"
          onChange={e => setName(e.target.value)}
        />
        <div className="save-vibe-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary-button" disabled={!name.trim()}>
            Save Vibe
          </button>
        </div>
      </form>
    </div>
  );
}

export default React.memo(SaveVibeModal);
