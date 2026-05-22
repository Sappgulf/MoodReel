import { useEffect, useRef, useCallback } from 'react';
import { focusFirstInDialog, handleTabTrapping } from '../utils/modalFocus';

let modalOpenCount = 0;
let modalBodyOverflow = '';

function lockBodyScroll() {
  if (modalOpenCount === 0) {
    modalBodyOverflow = document.body.style.overflow;
  }

  modalOpenCount += 1;
  document.body.style.overflow = 'hidden';
}

function unlockBodyScroll() {
  modalOpenCount = Math.max(modalOpenCount - 1, 0);
  if (modalOpenCount === 0) {
    document.body.style.overflow = modalBodyOverflow;
  }
}

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
    e => {
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
    lockBodyScroll();

    const timer = window.setTimeout(() => {
      moveFocus();
    }, 0);

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(timer);
      unlockBodyScroll();
      prevFocusRef.current?.focus?.();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown, moveFocus]);

  return { dialogRef };
}
