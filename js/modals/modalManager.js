/**
 * modalManager.js — Unified Modal Controller
 * Provides a single open/close API for all four modals.
 * Features:
 *  - ESC key closes the top-most modal
 *  - Backdrop click closes (unless modal is a lockout)
 *  - Basic focus trap (first/last focusable element)
 *  - Stacks correctly — multiple modals supported
 */

/** @type {Array<{id: string, onClose?: () => void}>} */
const _stack = [];

let _prevFocus = null;

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Open a modal by its DOM id.
 * @param {string} id - Element id of the modal overlay
 * @param {{ onClose?: () => void, isLockout?: boolean }} [opts]
 */
export function openModal(id, opts = {}) {
  const el = document.getElementById(id);
  if (!el) return;

  _prevFocus = document.activeElement;
  el.classList.remove('hidden');
  _stack.push({ id, ...opts });

  // Trap focus inside
  _trapFocus(el);
}

/**
 * Close a modal by its DOM id.
 * @param {string} id
 */
export function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;

  el.classList.add('hidden');

  const idx = _stack.findIndex(m => m.id === id);
  if (idx !== -1) {
    const entry = _stack.splice(idx, 1)[0];
    entry.onClose?.();
  }

  // Restore focus
  if (_prevFocus && typeof _prevFocus.focus === 'function') {
    _prevFocus.focus();
  }
}

/**
 * Close every open modal (used for hard resets like session restore).
 */
export function closeAllModals() {
  [..._stack].forEach(entry => closeModal(entry.id));
}

/** @returns {string|null} id of the top-most modal, or null */
export function topModal() {
  return _stack.length ? _stack.at(-1).id : null;
}

/* ── Focus trap ────────────────────────────────────────────── */
function _trapFocus(el) {
  const focusable = Array.from(el.querySelectorAll(FOCUSABLE)).filter(
    n => !n.disabled && !n.getAttribute('aria-hidden')
  );
  if (focusable.length) focusable[0].focus();

  el._trapHandler = (e) => {
    if (e.key !== 'Tab') return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  };
  el.addEventListener('keydown', el._trapHandler);
}

/* ── Global ESC handler ────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const top = _stack.at(-1);
  if (!top || top.isLockout) return; // lockout modal can't be ESC-dismissed
  closeModal(top.id);
});

/* ── Backdrop click handler ────────────────────────────────── */
// Wire after DOM is ready — called from app.js init
export function wireBackdropClicks() {
  document.querySelectorAll('[id^="modal-"]').forEach(modal => {
    modal.addEventListener('click', e => {
      if (e.target !== modal) return; // only the overlay itself, not its children
      const entry = _stack.find(m => m.id === modal.id);
      if (!entry || entry.isLockout) return;
      closeModal(modal.id);
    });
  });
}
