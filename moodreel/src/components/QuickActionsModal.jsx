import React, { useEffect, useMemo, useRef, useState } from 'react';

function QuickActionsModal({ isOpen, onClose, actions = [], title = 'Quick Actions' }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
      return;
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const filteredActions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return actions;

    return actions.filter((action) => {
      const haystack = [
        action.label,
        action.description,
        action.shortcut,
        ...(action.keywords || [])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [actions, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  const selectAction = (action) => {
    if (!action) return;
    action.onSelect?.();
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(filteredActions.length, 1));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + Math.max(filteredActions.length, 1)) % Math.max(filteredActions.length, 1));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      selectAction(filteredActions[selectedIndex] || filteredActions[0]);
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="quick-actions-backdrop" role="presentation" onClick={onClose}>
      <div className="quick-actions-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="quick-actions-header">
          <div>
            <p className="quick-actions-kicker">Command palette</p>
            <h2>{title}</h2>
          </div>
          <button type="button" className="quick-actions-close" onClick={onClose} aria-label="Close quick actions">
            ✕
          </button>
        </div>

        <input
          ref={inputRef}
          className="quick-actions-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search actions, navigation, or shortcuts..."
          aria-label="Search quick actions"
        />

        <div className="quick-actions-list" role="list" aria-label="Available actions">
          {filteredActions.length > 0 ? (
            filteredActions.map((action, index) => (
              <button
                key={action.id}
                type="button"
                className={`quick-action-item ${index === selectedIndex ? 'active' : ''}`}
                onClick={() => selectAction(action)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="quick-action-copy">
                  <span className="quick-action-label">{action.label}</span>
                  <span className="quick-action-description">{action.description}</span>
                </span>
                <span className="quick-action-meta">
                  {action.shortcut && <kbd>{action.shortcut}</kbd>}
                  {action.tone && <span className={`quick-action-tone quick-action-tone-${action.tone}`}>{action.tone}</span>}
                </span>
              </button>
            ))
          ) : (
            <div className="quick-actions-empty">
              No actions match “{query}”.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(QuickActionsModal);
