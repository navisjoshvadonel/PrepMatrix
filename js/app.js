/**
 * app.js — Main Application Orchestrator
 * Wires global concerns (theme, navigation, session restore)
 * and imports controller modules & modal handlers.
 */

import { AppState, setState } from './state.js';
import { navigateTo, restoreSession } from './router.js';
import { StorageEngine } from './engines/StorageEngine.js';
import { renderDashboard } from './controllers/dashboardController.js';
import { wireBackdropClicks } from './modals/modalManager.js';
import { sound } from './utils/soundEngine.js';

// Import controllers to register their DOM listeners
import './controllers/loginController.js';
import './controllers/onboardingController.js';
import './controllers/dashboardController.js';
import './controllers/adminController.js';

// Import modals to register their DOM listeners
import './modals/preplabModal.js';
import './modals/wellnessModal.js';
import './modals/roomInspectorModal.js';
import './modals/certificateModal.js';

const storageEngine = new StorageEngine();
const $ = id => document.getElementById(id);

/* ── Theme Handling ─────────────────────────────────────────── */
const btnThemeToggle = $('btn-theme-toggle');
const themeIconLight = $('theme-icon-light');
const themeIconDark  = $('theme-icon-dark');

function toggleTheme() {
  const isDark = !AppState.isDark;
  setState({ isDark });
  if (isDark) {
    document.documentElement.classList.add('dark');
    themeIconDark?.classList.add('hidden');
    themeIconLight?.classList.remove('hidden');
  } else {
    document.documentElement.classList.remove('dark');
    themeIconDark?.classList.remove('hidden');
    themeIconLight?.classList.add('hidden');
  }
}

btnThemeToggle?.addEventListener('click', () => {
  toggleTheme();
  sound.playClick?.();
});

/* ── Assessment Completion Route ────────────────────────────── */
window.addEventListener('assessment-complete', e => {
  const { skillScores, company } = e.detail;
  storageEngine.save({ skillScores, company });
  navigateTo('dashboard');
  renderDashboard(skillScores, company);
});

/* ── Application Initialization ─────────────────────────────── */
function init() {
  // Wire backdrop click dismissal for all modals
  wireBackdropClicks();

  // Attempt to restore previous session
  const saved = restoreSession();
  if (saved?.skillScores && saved?.company) {
    navigateTo('dashboard');
    renderDashboard(saved.skillScores, saved.company);
  } else {
    navigateTo('home');
  }
}

// Kick off when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
