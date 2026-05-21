import {
  FOCUSABLE_SELECTOR,
  getFocusableElements,
  handleTabTrapping,
  focusFirstInDialog,
} from './modalFocus';

describe('modalFocus', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="dialog" role="dialog">
        <button type="button" id="first">First</button>
        <button type="button" id="middle">Middle</button>
        <button type="button" id="last">Last</button>
      </div>
    `;
    document.querySelectorAll('#dialog button').forEach(node => {
      Object.defineProperty(node, 'offsetParent', { value: document.body, configurable: true });
    });
  });

  it('finds focusable controls inside a dialog', () => {
    const dialog = document.getElementById('dialog');
    const focusables = getFocusableElements(dialog);
    expect(focusables).toHaveLength(3);
    expect(focusables[0].id).toBe('first');
    expect(focusables[2].id).toBe('last');
  });

  it('wraps focus from last to first on Tab', () => {
    const dialog = document.getElementById('dialog');
    const last = document.getElementById('last');
    last.focus();

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    const handled = handleTabTrapping(event, dialog);

    expect(handled).toBe(true);
    expect(document.activeElement.id).toBe('first');
  });

  it('wraps focus from first to last on Shift+Tab', () => {
    const dialog = document.getElementById('dialog');
    const first = document.getElementById('first');
    first.focus();

    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
    const handled = handleTabTrapping(event, dialog);

    expect(handled).toBe(true);
    expect(document.activeElement.id).toBe('last');
  });

  it('focuses the first focusable element in a dialog', () => {
    const dialog = document.getElementById('dialog');
    focusFirstInDialog(dialog);
    expect(document.activeElement.id).toBe('first');
  });

  it('exports a stable focusable selector', () => {
    expect(FOCUSABLE_SELECTOR).toContain('button:not([disabled])');
  });
});
