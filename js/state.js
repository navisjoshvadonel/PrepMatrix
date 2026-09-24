/**
 * state.js — AppState
 * Single source of truth for all mutable application state.
 * Replaces scattered let-globals in app.js.
 *
 * Usage:
 *   import { AppState, setState, subscribe } from './state.js';
 *   setState({ view: 'dashboard', company: 'Google' });
 *   subscribe(state => console.log('State changed:', state));
 */

export const AppState = {
  /** Current active view */
  view: 'home', // 'home'|'login'|'onboarding'|'assessment'|'dashboard'|'admin'

  /** True when the logged-in role is admin */
  isAdminMode: false,

  /** Dark mode active */
  isDark: false,

  /** Company selected during onboarding */
  company: null,

  /** Skill scores from assessment or onboarding sliders [logic, ds, algo, sys] */
  skillScores: [50, 50, 50, 50],

  /** Live fatigue index driven by StressSentinel */
  fatigueValue: 40,

  /** Currently inspected room id (SDG 11 panel) */
  selectedRoomId: 1,

  /** Currently loaded PrepLab challenge key */
  currentChallengeKey: 'twoSum',

  /** Admin auto-refresh interval handle */
  adminRefreshInterval: null,
};

/** @type {Array<(state: typeof AppState) => void>} */
const _listeners = [];

/**
 * Subscribe to state changes.
 * @param {(state: typeof AppState) => void} fn
 * @returns {() => void} unsubscribe function
 */
export function subscribe(fn) {
  _listeners.push(fn);
  return () => {
    const idx = _listeners.indexOf(fn);
    if (idx !== -1) _listeners.splice(idx, 1);
  };
}

/**
 * Merge a partial patch into AppState and notify all subscribers.
 * @param {Partial<typeof AppState>} patch
 */
export function setState(patch) {
  Object.assign(AppState, patch);
  _listeners.forEach(fn => fn(AppState));
}
