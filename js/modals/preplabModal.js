/**
 * preplabModal.js — PrepLab Live Sandbox Modal
 * Wires the coding IDE modal: challenge switcher, code editor, sandboxed runner.
 *
 * CodeRunnerEngine safety: a 3-second wall-clock guard prevents infinite loops
 * from hanging the main thread indefinitely.
 */

import { AppState, setState } from '../state.js';
import { openModal, closeModal } from './modalManager.js';
import { CodeRunnerEngine, CODING_CHALLENGES } from '../engines/CodeRunnerEngine.js';
import { sound } from '../utils/soundEngine.js';

const codeEngine = new CodeRunnerEngine();
const $ = id => document.getElementById(id);

/* ── Listen for open events from sprint cards + nav ───────────── */
window.addEventListener('open-preplab', e => {
  const key = e.detail?.challengeKey || 'twoSum';
  openPrepLab(key);
});

$('btn-nav-preplab')?.addEventListener('click', () => openPrepLab('twoSum'));
$('btn-open-preplab')?.addEventListener('click', () => openPrepLab('twoSum'));

/* ── Challenge switcher ──────────────────────────────────────── */
$('preplab-challenge-select')?.addEventListener('change', e => {
  openPrepLab(e.target.value);
});

/* ── Close ───────────────────────────────────────────────────── */
$('btn-close-preplab')?.addEventListener('click', () => {
  closeModal('modal-preplab');
  sound.playClick();
});

/* ══════════════════════════════════════════════════
   Open PrepLab
══════════════════════════════════════════════════ */
export function openPrepLab(challengeKey = 'twoSum') {
  setState({ currentChallengeKey: challengeKey });

  const challenge = CODING_CHALLENGES[challengeKey] || CODING_CHALLENGES.twoSum;

  const titleEl   = $('preplab-title');
  const descEl    = $('preplab-desc');
  const diffEl    = $('preplab-diff');
  const editorEl  = $('preplab-editor');
  const selectEl  = $('preplab-challenge-select');
  const resultsEl = $('preplab-results');

  if (titleEl)   titleEl.textContent  = challenge.title;
  if (descEl)    descEl.textContent   = challenge.description;
  if (diffEl)    diffEl.textContent   = challenge.difficulty.toUpperCase();
  if (editorEl)  editorEl.value       = challenge.starterCode;
  if (selectEl)  selectEl.value       = challengeKey;
  if (resultsEl) resultsEl.classList.add('hidden');

  openModal('modal-preplab');
  sound.playClick();
}

/* ══════════════════════════════════════════════════
   Run Code (with 3s timeout guard)
══════════════════════════════════════════════════ */
$('btn-run-code')?.addEventListener('click', () => {
  const code     = $('preplab-editor')?.value || '';
  const btnEl    = $('btn-run-code');
  const resultsEl = $('preplab-results');
  const speedEl  = $('preplab-speed');
  const casesEl  = $('preplab-cases-container');

  if (btnEl) {
    btnEl.disabled = true;
    btnEl.textContent = '⏳ Running…';
  }

  // Run in next tick so UI updates first
  setTimeout(async () => {
    try {
      const outcome = await codeEngine.execute(code, AppState.currentChallengeKey);

      if (resultsEl) resultsEl.classList.remove('hidden');
      if (speedEl)   speedEl.textContent = `${outcome.totalTimeMs}ms`;

      if (casesEl) {
        casesEl.innerHTML = '';
        if (!outcome.success) {
          sound.playWrong?.();
          casesEl.innerHTML = `
            <div class="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 font-mono text-xs">
              <strong>Runtime Exception:</strong> ${outcome.error}
            </div>
          `;
        } else {
          outcome.allPassed ? sound.playCelebration?.() : sound.playWrong?.();
          outcome.results.forEach(res => {
            casesEl.insertAdjacentHTML('beforeend', `
              <div class="p-3 rounded-xl border ${res.passed ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-red-500/30 bg-red-500/10'} text-xs font-mono flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-5 h-5 rounded-full ${res.passed ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'} flex items-center justify-center font-bold text-[10px]">
                    ${res.passed ? '✓' : '✗'}
                  </span>
                  <span class="text-slate-200">Case ${res.caseNum}: Input: ${res.input}</span>
                </div>
                <div class="text-right">
                  <span class="${res.passed ? 'text-emerald-400 font-bold' : 'text-red-400'}">${res.passed ? 'Passed' : 'Failed'}</span>
                  <span class="text-slate-400 ml-2">${res.timeMs}ms</span>
                </div>
              </div>
            `);
          });
        }
      }
    } catch (err) {
      if (casesEl) {
        casesEl.innerHTML = `
          <div class="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 font-mono text-xs">
            <strong>Unexpected Error:</strong> ${err.message}
          </div>
        `;
      }
    } finally {
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.innerHTML = '<span>▶</span> Run Test Suite';
      }
    }
  }, 10);
});
