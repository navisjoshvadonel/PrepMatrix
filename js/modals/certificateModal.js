/**
 * certificateModal.js — Official Credential Certificate (SDG 8 & SDG 4)
 * Generates cryptographic demonstration hash via SHA-256 (Web Crypto API)
 * and enables PDF printing and JSON data export.
 */

import { AppState } from '../state.js';
import { openModal, closeModal } from './modalManager.js';
import { sound } from '../utils/soundEngine.js';

const $ = id => document.getElementById(id);

/**
 * Generate a SHA-256 token from session parameters.
 * @param {number} score
 * @param {string} company
 * @param {number|string} timestamp
 * @returns {Promise<string>}
 */
export async function generateToken(score, company, timestamp) {
  try {
    const raw = `PM|${company}|${score}|${timestamp}`;
    const encoder = new TextEncoder();
    const buf = await crypto.subtle.digest('SHA-256', encoder.encode(raw));
    const hex = Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return `PM-${hex.slice(0, 4).toUpperCase()}-${hex.slice(4, 8).toUpperCase()}-SDG`;
  } catch {
    // Fallback if subtle crypto is somehow unavailable
    return `PM-2026-X89F-SDG`;
  }
}

/**
 * Open and populate certificate modal.
 * @param {number} [score]
 * @param {string} [company]
 */
export async function openCertificateModal(score, company) {
  const currentScore = score !== undefined ? score : (parseInt($('ui-sdg4-score')?.textContent) || 85);
  const currentCompany = company || AppState.company || 'TCS';

  const modal     = $('modal-certificate');
  const targetEl  = $('cert-company-target');
  const scoreEl   = $('cert-readiness');
  const gradeEl   = $('cert-grade');
  const hashEl    = $('cert-hash');

  const grade = currentScore >= 90 ? 'Grade S+' : currentScore >= 80 ? 'Grade A' : currentScore >= 70 ? 'Grade B' : 'Grade C';

  if (targetEl) targetEl.textContent = `${currentCompany} Placement Standards`;
  if (scoreEl)  scoreEl.textContent  = `${currentScore}%`;
  if (gradeEl)  gradeEl.textContent  = grade;

  if (hashEl) {
    hashEl.textContent = 'Generating signature…';
    const token = await generateToken(currentScore, currentCompany, Date.now());
    hashEl.textContent = token;
  }

  openModal('modal-certificate');
  sound.playCelebration?.();
}

/**
 * Export current candidate assessment results to downloadable JSON.
 */
export function exportResultsJSON() {
  const data = {
    platform: 'PrepMatrix Command Centre',
    candidate: 'Simulated Candidate',
    company: AppState.company || 'TCS',
    skillScores: AppState.skillScores,
    fatigueValue: AppState.fatigueValue,
    exportedAt: new Date().toISOString(),
    verification: $('cert-hash')?.textContent || 'PM-DEMO-VERIFIED',
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `prepmatrix-results-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

/* ── DOM Event Listeners ─────────────────────────────────────── */
$('btn-open-certificate')?.addEventListener('click', () => {
  openCertificateModal();
});

$('btn-close-certificate')?.addEventListener('click', () => {
  closeModal('modal-certificate');
  sound.playClick?.();
});

$('btn-print-certificate')?.addEventListener('click', () => {
  window.print();
});

$('btn-export-certificate-json')?.addEventListener('click', () => {
  exportResultsJSON();
  sound.playClick?.();
});
