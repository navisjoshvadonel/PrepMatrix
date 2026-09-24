/**
 * wellnessModal.js — Guided Bio-Break Modal
 * Manages the 4-7-8 breathing session with full UI wiring.
 * On completion, de-escalates fatigue and releases the lockout if active.
 */

import { AppState, setState } from '../state.js';
import { openModal, closeModal } from './modalManager.js';
import { WellnessEngine } from '../engines/WellnessEngine.js';
import { renderSDG3WithValue, releaseLockout } from '../controllers/dashboardController.js';
import { sound } from '../utils/soundEngine.js';

const wellnessEngine = new WellnessEngine();
const $ = id => document.getElementById(id);

/* ── Open from toolbar + SDG3 card ──────────────────────────── */
$('btn-open-wellness')?.addEventListener('click', openWellnessModal);
$('btn-trigger-wellness')?.addEventListener('click', openWellnessModal);

// Opened by dashboardController when lockout recovery button is pressed
window.addEventListener('open-wellness-from-lockout', openWellnessModal);

/* ── Close / finish ──────────────────────────────────────────── */
$('btn-close-wellness')?.addEventListener('click', () => {
  wellnessEngine.stopSession();
  closeModal('modal-wellness');
  sound.playClick();
});

$('btn-finish-wellness')?.addEventListener('click', completeWellnessBreak);

/* ══════════════════════════════════════════════════
   Open
══════════════════════════════════════════════════ */
export function openWellnessModal() {
  openModal('modal-wellness');

  const instruction = $('wellness-instruction');
  const phaseTimer  = $('wellness-phase-timer');
  const timeLeft    = $('wellness-time-left');

  wellnessEngine.startSession(
    remaining => {
      if (timeLeft) timeLeft.textContent = `${remaining}s`;
    },
    (phase, cycleSec) => {
      if (phase === 'inhale') {
        if (instruction) instruction.textContent = 'Inhale deeply...';
        if (phaseTimer)  phaseTimer.textContent  = `${4 - (cycleSec % 4)}s`;
      } else if (phase === 'hold') {
        if (instruction) instruction.textContent = 'Hold your breath...';
        if (phaseTimer)  phaseTimer.textContent  = `${11 - cycleSec}s`;
      } else {
        if (instruction) instruction.textContent = 'Exhale slowly...';
        if (phaseTimer)  phaseTimer.textContent  = `${19 - cycleSec}s`;
      }
    },
    () => completeWellnessBreak()
  );
}

/* ══════════════════════════════════════════════════
   Complete — de-escalate fatigue, release lockout
══════════════════════════════════════════════════ */
function completeWellnessBreak() {
  wellnessEngine.stopSession();
  closeModal('modal-wellness');

  // De-escalate fatigue by 25-30 pts
  const newFatigue = Math.max(15, AppState.fatigueValue - 28);
  setState({ fatigueValue: newFatigue });
  renderSDG3WithValue(newFatigue);

  // Release lockout if it was active
  releaseLockout();

  sound.playCorrect?.();
}
