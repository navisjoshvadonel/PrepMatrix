/**
 * loginController.js — Auth Form Controller
 * Handles credential validation, admin/student routing, and form UI feedback.
 *
 * Mock credentials (demo only — no real auth backend):
 *   Student:  student@university.edu / student123
 *   Admin:    admin@university.edu  / admin123
 */

import { setState, AppState } from '../state.js';
import { navigateTo } from '../router.js';
import { initCanvasAnimation } from '../animation.js';
import { sound } from '../utils/soundEngine.js';

/* ── Mock credential store ──────────────────────────────────── */
const MOCK_USERS = {
  'student@university.edu': { password: 'student123', role: 'student' },
  'admin@university.edu':   { password: 'admin123',   role: 'admin'   },
};

/* ── DOM refs ───────────────────────────────────────────────── */
const $ = id => document.getElementById(id);

const btnNavStudent  = $('btn-nav-student');
const btnNavAdmin    = $('btn-nav-admin');
const btnLogin       = $('btn-login');
const btnBackHome    = $('btn-back-home');
const logoLink       = $('logo-link');
const loginHeading   = $('login-heading');
const loginEmail     = $('login-email');
const loginPassword  = $('login-password');
const formLogin      = $('form-login');

// Canvas animation on the left panel of login
initCanvasAnimation('ds-canvas');

/* ── Error UI ────────────────────────────────────────────────── */
function showLoginError(message) {
  let errEl = $('login-error-msg');
  if (!errEl) {
    errEl = document.createElement('p');
    errEl.id = 'login-error-msg';
    errEl.className = 'text-sm text-red-600 dark:text-red-400 mt-2 font-medium animate-slide-up';
    formLogin?.insertBefore(errEl, $('btn-login'));
  }
  errEl.textContent = message;
  errEl.style.display = 'block';
}

function clearLoginError() {
  const errEl = $('login-error-msg');
  if (errEl) errEl.style.display = 'none';
}

/* ── Credential validation ──────────────────────────────────── */
function validateAndLogin() {
  clearLoginError();

  const email = loginEmail?.value?.trim() || '';
  const pass  = loginPassword?.value || '';

  if (!email || !pass) {
    showLoginError('Please enter your email and password.');
    return;
  }

  const user = MOCK_USERS[email.toLowerCase()];
  if (!user || user.password !== pass) {
    showLoginError('Invalid credentials. Use student@university.edu / student123 or admin@university.edu / admin123');
    // Shake the button
    btnLogin?.classList.add('animate-pulse');
    setTimeout(() => btnLogin?.classList.remove('animate-pulse'), 800);
    sound.playWrong?.();
    return;
  }

  const isAdmin = user.role === 'admin';
  setState({ isAdminMode: isAdmin });
  sound.playClick();

  if (isAdmin) {
    // Admin → admin dashboard (wired in adminController)
    window.dispatchEvent(new CustomEvent('navigate-admin'));
  } else {
    navigateTo('onboarding');
  }
}

/* ── Nav event listeners ─────────────────────────────────────── */
btnNavStudent?.addEventListener('click', () => {
  setState({ isAdminMode: false });
  if (loginHeading) loginHeading.textContent = 'Login to your account';
  navigateTo('login', { noPadding: true });
  sound.playClick();
});

btnNavAdmin?.addEventListener('click', () => {
  setState({ isAdminMode: true });
  if (loginHeading) loginHeading.textContent = 'Admin Login';
  // Pre-fill admin credentials as a hint
  if (loginEmail)    loginEmail.value    = 'admin@university.edu';
  if (loginPassword) loginPassword.value = '';
  navigateTo('login', { noPadding: true });
  sound.playClick();
});

btnLogin?.addEventListener('click', validateAndLogin);
formLogin?.addEventListener('submit', e => { e.preventDefault(); validateAndLogin(); });

logoLink?.addEventListener('click', () => {
  setState({ isAdminMode: false });
  navigateTo('home');
});

btnBackHome?.addEventListener('click', e => {
  e.preventDefault();
  setState({ isAdminMode: false });
  navigateTo('home');
});

// Clear pre-filled email/password when student tab is clicked (avoid confusion)
btnNavStudent?.addEventListener('click', () => {
  if (loginEmail)    loginEmail.value    = '';
  if (loginPassword) loginPassword.value = '';
  clearLoginError();
});
