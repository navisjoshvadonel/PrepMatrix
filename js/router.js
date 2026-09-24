/**
 * router.js — SPA View Router
 * Owns all show/hide logic for the six views.
 * Replaces duplicated classList manipulation scattered across app.js.
 */

import { AppState, setState } from './state.js';
import { StorageEngine } from './engines/StorageEngine.js';

const storageEngine = new StorageEngine();

/** @type {Object.<string, {el: HTMLElement|null, show: string[]}>} */
const VIEW_MAP = {
  home:        { id: 'view-home',       classes: ['flex'] },
  login:       { id: 'view-login',      classes: ['flex', 'flex-row'] },
  onboarding:  { id: 'view-onboarding', classes: ['flex', 'flex-col'] },
  assessment:  { id: 'view-assessment', classes: ['flex', 'flex-col'] },
  dashboard:   { id: 'view-dashboard',  classes: ['block'] },
  admin:       { id: 'view-admin',      classes: ['block'] },
};

const mainContent = document.getElementById('main-content');

/**
 * Hide every view section, clear admin refresh timer.
 */
export function hideAllViews() {
  Object.values(VIEW_MAP).forEach(({ id, classes }) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('hidden');
    el.classList.remove(...classes);
  });

  mainContent?.classList.remove('no-padding');

  // Stop admin refresh when navigating away
  if (AppState.adminRefreshInterval) {
    clearInterval(AppState.adminRefreshInterval);
    setState({ adminRefreshInterval: null });
  }
}

/**
 * Navigate to a named view, showing it and hiding the rest.
 * @param {'home'|'login'|'onboarding'|'assessment'|'dashboard'|'admin'} viewName
 * @param {object} [opts]
 * @param {boolean} [opts.noPadding] - adds no-padding class to main
 */
export function navigateTo(viewName, opts = {}) {
  hideAllViews();
  setState({ view: viewName });

  const entry = VIEW_MAP[viewName];
  if (!entry) { console.warn(`[Router] Unknown view: ${viewName}`); return; }

  const el = document.getElementById(entry.id);
  if (!el) return;
  el.classList.remove('hidden');
  el.classList.add(...entry.classes);

  if (opts.noPadding) mainContent?.classList.add('no-padding');
}

/**
 * On app load: restore a previous session from localStorage and
 * navigate directly to the dashboard if one exists.
 * Returns the saved session if found, or null.
 * @returns {{ skillScores: number[], company: string }|null}
 */
export function restoreSession() {
  try {
    const saved = storageEngine.load();
    if (saved?.skillScores && saved?.company) {
      return saved;
    }
  } catch (e) {
    console.warn('[Router] Session restore failed', e);
  }
  return null;
}
