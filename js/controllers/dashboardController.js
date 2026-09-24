/**
 * dashboardController.js — Student Dashboard Renderer
 * Pulls SDG 4/3/11 engine results and renders the student dashboard.
 * Also owns the 7-day sprint panel and lockout logic.
 */

import { AppState, setState } from '../state.js';
import { StorageEngine } from '../engines/StorageEngine.js';
import { SkillMatrixEngine, DEFAULT_COMPANY_BENCHMARKS } from '../engines/SkillMatrixEngine.js';
import { StressSentinel }  from '../engines/StressSentinel.js';
import { RoadmapEngine }   from '../engines/RoadmapEngine.js';
import { RoomController }  from '../engines/RoomController.js';
import { sound }           from '../utils/soundEngine.js';
import { openModal, closeModal } from '../modals/modalManager.js';
import { openRoomInspector } from '../modals/roomInspectorModal.js';

/* ── Engine singletons ──────────────────────────────────────── */
const skillEngine    = new SkillMatrixEngine();
const sentinelEngine = new StressSentinel();
const roadmapEngine  = new RoadmapEngine();
const roomController = new RoomController(10);
const storageEngine  = new StorageEngine();

/* ── DOM refs ───────────────────────────────────────────────── */
const $ = id => document.getElementById(id);

const dashCompanyName = $('dash-company-name');
const sdg4Score       = $('ui-sdg4-score');
const sdg4List        = $('ui-sdg4-list');
const sdg11Energy     = $('ui-sdg11-energy');
const sdg11Grid       = $('ui-sdg11-grid');
const sdg3Bar         = $('ui-sdg3-bar');
const sdg3Index       = $('ui-sdg3-index');
const sdg3Pct         = $('ui-sdg3-pct');
const sdg3Track       = sdg3Bar?.parentElement;
const lockoutModal    = $('ui-lockout-modal');
const lockoutDisplay  = $('lockout-fatigue-display');

const FATIGUE_MAX_DISPLAY = 150;

/* ══════════════════════════════════════════════════
   PUBLIC API — called from app.js after assessment
══════════════════════════════════════════════════ */

/**
 * Run all engines with given scores and render the dashboard.
 * @param {number[]} skillScores - [logic, ds, algo, sys] 0-100
 * @param {string} company
 */
export function renderDashboard(skillScores, company) {
  setState({ skillScores, company });

  if (dashCompanyName) dashCompanyName.textContent = company;

  const compConfig  = DEFAULT_COMPANY_BENCHMARKS[company] || DEFAULT_COMPANY_BENCHMARKS['TCS'];
  const targetSkills = compConfig.targets;
  const weights      = compConfig.weights;

  const avgSkill = skillScores.reduce((a, b) => a + b, 0) / skillScores.length;

  // Persist session for page-refresh restore
  storageEngine.save({ skillScores, company });

  const scoreHistory = [
    Math.round(avgSkill + 5),
    Math.round(avgSkill),
    Math.round(avgSkill - 5),
    Math.round(avgSkill - 20),
  ];

  const sdg4Result = skillEngine.calculateGaps(skillScores, targetSkills, weights);
  const sdg3Result = sentinelEngine.analyzeFatigue(scoreHistory, 4);

  _renderSDG4(sdg4Result, targetSkills);
  _updateSDG11();
  _renderSDG3(sdg3Result);
  _render7DaySprint(skillScores, company);
}

/* ══════════════════════════════════════════════════
   SDG 4 — Skill Readiness Matrix
══════════════════════════════════════════════════ */
function _gapClass(gap, target) {
  if (gap === 0)              return 'pm-gap-fill--none';
  const ratio = gap / target;
  if (ratio > 0.4)            return 'pm-gap-fill--high';
  if (ratio > 0.15)           return 'pm-gap-fill--mid';
  return 'pm-gap-fill--low';
}

function _renderSDG4({ readinessScore, skillGaps, tiers, priorities }, targetSkills) {
  if (!sdg4Score || !sdg4List) return;

  sdg4Score.textContent = readinessScore;
  const metric = sdg4Score.closest('.pm-metric') ?? sdg4Score.parentElement;
  metric.classList.toggle('pm-metric--terracotta', readinessScore < 60);
  metric.classList.toggle('pm-metric--forest',     readinessScore >= 60);

  const labels = ['Core Logic', 'Data Structures', 'Algorithms', 'System Design'];
  sdg4List.innerHTML = '';

  if (!skillGaps?.length) {
    sdg4List.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">No skill data available.</p>';
    return;
  }

  skillGaps.forEach((gap, i) => {
    const target   = targetSkills[i] ?? 100;
    const fillPct  = Math.min(100, Math.round((gap / target) * 100));
    const modifier = _gapClass(gap, target);
    const label    = labels[i];
    const tier     = tiers?.[i] ?? { tier: 'COMPETENT', badgeClass: 'bg-emerald-100 text-emerald-800' };
    const priority = priorities?.find(p => p.skill === label);
    const effortText = priority?.estimatedHours > 0 ? `· ~${priority.estimatedHours}h practice` : '';
    const gapLabel = gap === 0 ? 'Ready ✓' : `Gap: ${gap} pts ${effortText}`;

    sdg4List.insertAdjacentHTML('beforeend', `
      <div class="pm-gap-item" aria-label="${label}: ${gapLabel}">
        <div class="pm-gap-item__label flex items-center justify-between">
          <span class="flex items-center gap-1.5 font-semibold text-xs sm:text-sm">
            ${label}
            <span class="text-[9px] font-bold px-1.5 py-0.2 rounded ${tier.badgeClass}">${tier.tier}</span>
          </span>
          <span class="text-xs font-mono">${gapLabel}</span>
        </div>
        <div class="pm-gap-track">
          <div class="pm-gap-fill ${modifier}" style="width: ${fillPct}%;" role="img" aria-label="${fillPct}% gap"></div>
        </div>
      </div>
    `);
  });
}

/* ══════════════════════════════════════════════════
   SDG 11 — Campus Resource Router
══════════════════════════════════════════════════ */
function _updateSDG11() {
  const metrics = roomController.getMetrics();
  if (sdg11Energy) sdg11Energy.textContent = metrics.energySavedKWh;

  const co2El  = $('ui-sdg11-co2');
  const costEl = $('ui-sdg11-cost');
  if (co2El)  co2El.textContent  = `${metrics.co2AvoidedKg} kg`;
  if (costEl) costEl.textContent = `₹${metrics.costSaved}`;

  if (sdg11Grid) {
    sdg11Grid.innerHTML = '';
    metrics.rooms.forEach(r => {
      const isActive = r.status === 'active';
      const pill = document.createElement('div');
      pill.className = `pm-room-pill ${isActive ? 'pm-room-pill--active' : 'pm-room-pill--sleep'}`;
      pill.textContent = `R${r.id}`;
      pill.title = `Click to inspect ${r.name} (${r.status})`;
      pill.addEventListener('click', () => openRoomInspector(r.id, roomController));
      sdg11Grid.appendChild(pill);
    });
  }

  const sdg11Spillover = $('ui-sdg11-spillover');
  if (sdg11Spillover) sdg11Spillover.style.display = 'none';
}

export { _updateSDG11 as updateSDG11 };

/* ══════════════════════════════════════════════════
   SDG 3 — Cognitive Stress Sentinel
══════════════════════════════════════════════════ */
function _renderSDG3({ lockoutRequired, fatigueIndex }) {
  setState({ fatigueValue: fatigueIndex });

  if (!sdg3Index || !sdg3Bar) return;

  sdg3Index.textContent = fatigueIndex.toFixed(1);
  const pct = Math.min(100, Math.round((fatigueIndex / FATIGUE_MAX_DISPLAY) * 100));
  sdg3Bar.style.width = `${pct}%`;
  if (sdg3Pct) sdg3Pct.textContent = `${pct}%`;
  sdg3Track?.setAttribute('aria-valuenow', fatigueIndex.toFixed(1));

  sdg3Bar.style.background = fatigueIndex > 75
    ? 'linear-gradient(90deg, #D96B43, #B8532E)'
    : 'linear-gradient(90deg, #F5A623, #D96B43)';

  if (lockoutRequired) _triggerLockout(fatigueIndex);
}

export function renderSDG3WithValue(fatigueIndex) {
  const lockoutRequired = fatigueIndex > 100;
  _renderSDG3({ lockoutRequired, fatigueIndex });
}

/* ── Lockout ─────────────────────────────────────────────────── */
function _triggerLockout(fatigueIndex) {
  if (lockoutDisplay) lockoutDisplay.textContent = fatigueIndex.toFixed(1);
  openModal('ui-lockout-modal', { isLockout: true });
  document.body.classList.add('locked');
  document.addEventListener('keydown', _trapKeyboard, true);
}

function _trapKeyboard(e) {
  if (e.key === 'Escape' || e.key === 'Tab') {
    e.preventDefault();
    e.stopPropagation();
  }
}

export function releaseLockout() {
  closeModal('ui-lockout-modal');
  document.body.classList.remove('locked');
  document.removeEventListener('keydown', _trapKeyboard, true);
}

/* ── Lockout recovery button ─────────────────────────────────── */
$('btn-lockout-recovery')?.addEventListener('click', () => {
  // Keep lockout overlay visible until wellness completes —
  // wellnessController will call releaseLockout() on completion.
  window.dispatchEvent(new CustomEvent('open-wellness-from-lockout'));
});

/* ══════════════════════════════════════════════════
   7-DAY SPRINT PLAN
══════════════════════════════════════════════════ */
function _render7DaySprint(skillScores, company) {
  const sprint    = roadmapEngine.generateSprint(skillScores, company);
  const container = $('sprint-days-container');
  if (!container) return;

  container.innerHTML = '';
  _updateSprintProgress(0, 7);

  sprint.forEach(dayPlan => {
    const card = document.createElement('div');
    card.className = 'bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-5 border border-gray-200 dark:border-slate-700/80 flex flex-col justify-between hover:shadow-md transition-all group';
    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between mb-3">
          <span class="w-8 h-8 rounded-full bg-forest dark:bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">D${dayPlan.day}</span>
          <span class="text-[10px] font-bold px-2.5 py-1 rounded-full ${dayPlan.tagColor}">${dayPlan.tag}</span>
        </div>
        <h4 class="font-bold text-forest dark:text-white text-sm mb-1">${dayPlan.title}</h4>
        <p class="text-xs text-gray-400 mb-3">⏱ ${dayPlan.hours} estimated study</p>
        <ul class="space-y-2 mb-4 text-xs text-gray-600 dark:text-slate-300">
          ${dayPlan.tasks.map(t => `
            <li class="flex items-start gap-2">
              <input type="checkbox" class="sprint-checkbox mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600">
              <span class="leading-tight">${t}</span>
            </li>
          `).join('')}
        </ul>
      </div>
      <button class="btn-launch-day-lab w-full py-2 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 mt-2">
        🚀 Practice Day Challenge
      </button>
    `;

    card.querySelector('.btn-launch-day-lab')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('open-preplab', { detail: { challengeKey: 'twoSum' } }));
    });

    card.querySelectorAll('.sprint-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        sound[cb.checked ? 'playCorrect' : 'playClick']?.();
        _recalcSprintProgress();
      });
    });

    container.appendChild(card);
  });
}

function _recalcSprintProgress() {
  const checkboxes = document.querySelectorAll('.sprint-checkbox');
  const checked    = document.querySelectorAll('.sprint-checkbox:checked').length;
  const dayEquiv   = Math.round((checked / Math.max(1, checkboxes.length)) * 7);
  _updateSprintProgress(dayEquiv, 7);
}

function _updateSprintProgress(done, total) {
  const txt = $('sprint-progress-text');
  const pct = $('sprint-pct');
  const pctVal = Math.round((done / total) * 100);
  if (txt) txt.textContent = `${done} / ${total} Days`;
  if (pct) pct.textContent = `${pctVal}%`;
}
