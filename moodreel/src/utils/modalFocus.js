export const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

export function getFocusableElements(dialogNode) {
    if (!dialogNode) return [];
    return Array.from(dialogNode.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (node) => node.offsetParent !== null && !node.disabled
    );
}

export function focusFirstInDialog(dialogNode, fallbackRef = null) {
    const candidates = getFocusableElements(dialogNode);
    const fallbackNode = fallbackRef?.current;

    if (fallbackNode && !fallbackNode.disabled) {
        fallbackNode.focus?.();
        return;
    }

    const target = candidates[0] || dialogNode;
    target?.focus?.();
}

export function handleTabTrapping(e, dialogNode) {
    if (e.key !== 'Tab' || !dialogNode) return false;

    const focusables = getFocusableElements(dialogNode);
    if (!focusables.length) return false;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
        return true;
    }

    if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
        return true;
    }

    return false;
}
