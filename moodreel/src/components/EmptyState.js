import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Reusable component for empty states
 */
function EmptyState({ icon, title, description, actionLink, actionText, onActionClick }) {
    return (
        <div className="empty-state">
            <div className="empty-state-icon">{icon}</div>
            <h3 className="empty-state-title">{title}</h3>
            <p className="empty-state-description">{description}</p>
            {actionLink ? (
                <Link to={actionLink} className="empty-state-action">
                    {actionText}
                </Link>
            ) : onActionClick ? (
                <button onClick={onActionClick} className="empty-state-action">
                    {actionText}
                </button>
            ) : null}
        </div>
    );
}

export default React.memo(EmptyState);
