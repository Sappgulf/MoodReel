import { useEffect, useRef, useCallback } from 'react';
import { focusFirstInDialog, handleTabTrapping } from '../utils/modalFocus';

export function useModalDialog({
    isOpen,
    onClose,
    focusRef = null,
    onOpenFocusRef = null,
    onKeyDown = null,
}) {
    const dialogRef = useRef(null);
    const prevFocusRef = useRef(null);

    const moveFocus = useCallback(() => {
        focusFirstInDialog(dialogRef.current, onOpenFocusRef || focusRef);
    }, [onOpenFocusRef, focusRef]);

    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === 'Escape') {
                onClose();
                return;
            }

            const trapped = handleTabTrapping(e, dialogRef.current);
            if (trapped) {
                return;
            }

            onKeyDown?.(e);
        },
        [onClose, onKeyDown]
    );

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        prevFocusRef.current = document.activeElement;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const timer = window.setTimeout(() => {
            moveFocus();
        }, 0);

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.clearTimeout(timer);
            document.body.style.overflow = prevOverflow;
            prevFocusRef.current?.focus?.();
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, handleKeyDown, moveFocus]);

    return { dialogRef };
}
