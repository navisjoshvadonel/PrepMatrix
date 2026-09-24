/**
 * adminController.js — Admin Dashboard Renderer
 * Owns all admin KPI, heatmap, company bars, dept table, and at-risk board rendering.
 * Shows loading skeleton + error state on failure.
 * Includes a "Simulated Data" badge to be honest about data provenance.
 */

import { setState, AppState } from '../state.js';
import { generateStudentCohort, getAdminStats } from '../utils/mockData.js';
import { navigateTo } from '../router.js';

/* ── DOM refs ───────────────────────────────────────────────── */
const $ = id => document.getElementById(id);

/* ══════════════════════════════════════════════════
   PUBLIC — Called from app.js on admin login
══════════════════════════════════════════════════ */
export function initAdminDashboard() {
  renderAdminDashboard();

  // Auto-refresh every 30s
  const intervalId = setInterval(renderAdminDashboard, 30000);
  setState({ adminRefreshInterval: intervalId });

  // Manual refresh button
  $('btn-admin-refresh')?.addEventListener('click', renderAdminDashboard);
}

/* ── Route listener ─────────────────────────────────────────── */
window.addEventListener('navigate-admin', () => {
  navigateTo('admin');
  initAdminDashboard();
});

/* ══════════════════════════════════════════════════
   RENDER PIPELINE
══════════════════════════════════════════════════ */
function renderAdminDashboard() {
  _showSkeleton();

  try {
    const cohort = generateStudentCohort(120);

    if (!Array.isArray(cohort) || cohort.length === 0) {
      throw new Error('Empty cohort data returned from generator.');
    }

    const stats = getAdminStats(cohort);

    _hideSkeleton();
    _renderKPIs(stats);
    _renderHeatMap(stats);
    _renderCompanyBars(stats.byCompany);
    _renderDeptTable(stats.byDept);
    _renderAtRiskBoard(stats.atRiskStudents);
  } catch (err) {
    _showError(`Failed to load admin data: ${err.message}`);
    console.error('[AdminController] renderAdminDashboard error:', err);
  }
}

/* ══════════════════════════════════════════════════
   SKELETON / ERROR STATES
══════════════════════════════════════════════════ */
function _showSkeleton() {
  ['adm-total','adm-active','adm-atrisk'].forEach(id => {
    const el = $(id);
    if (el) el.textContent = '…';
  });
  const readiness = $('adm-readiness');
  if (readiness) {
    const span = readiness.querySelector('span');
    if (span) readiness.childNodes[0].textContent = '…';
  }

  const heatmap = $('adm-room-heatmap');
  if (heatmap) {
    heatmap.innerHTML = Array.from({ length: 20 }).map(() =>
      `<div class="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl aspect-square animate-pulse"></div>`
    ).join('');
  }
}

function _hideSkeleton() { /* skeleton is replaced by real content — no-op needed */ }

function _showError(message) {
  const container = $('adm-room-heatmap');
  if (container) {
    container.innerHTML = `
      <div class="col-span-5 flex flex-col items-center justify-center py-10 text-center gap-2">
        <span class="text-3xl">⚠️</span>
        <p class="text-sm font-semibold text-red-500">${message}</p>
        <button onclick="location.reload()" class="text-xs px-4 py-2 bg-terracotta/20 text-terracotta rounded-lg hover:bg-terracotta/30 transition-colors font-bold mt-1">Reload</button>
      </div>
    `;
  }
  ['adm-total','adm-active','adm-atrisk'].forEach(id => {
    const el = $(id);
    if (el) el.textContent = '—';
  });
}

/* ══════════════════════════════════════════════════
   KPI CARDS
══════════════════════════════════════════════════ */
function _renderKPIs(stats) {
  const admTotal    = $('adm-total');
  const admActive   = $('adm-active');
  const admReadiness = $('adm-readiness');
  const admAtRisk   = $('adm-atrisk');
  const admAtRiskGlow = $('adm-atrisk-glow');

  if (admTotal)    admTotal.textContent    = stats.total;
  if (admActive)   admActive.textContent   = stats.active;
  if (admReadiness) {
    const span = admReadiness.querySelector('span');
    if (admReadiness.childNodes[0]) {
      admReadiness.childNodes[0].textContent = stats.avgReadiness;
    }
  }
  if (admAtRisk) {
    admAtRisk.textContent = stats.atRisk;
    admAtRiskGlow?.classList.toggle('hidden', stats.atRisk === 0);
  }

  const admEnergy = $('adm-energy');
  if (admEnergy) admEnergy.textContent = stats.campus.energySaved;
}

/* ══════════════════════════════════════════════════
   CAMPUS HEAT MAP
══════════════════════════════════════════════════ */
function _renderHeatMap({ campus, active }) {
  const grid = $('adm-room-heatmap');
  if (!grid) return;
  grid.innerHTML = '';

  const CAPACITY = 12;
  const studentsPerRoom = active / Math.max(1, campus.activeRooms);

  for (let r = 1; r <= campus.TOTAL_ROOMS; r++) {
    const isActive     = r <= campus.activeRooms;
    const occupancyPct = isActive
      ? Math.min(100, Math.round((studentsPerRoom / CAPACITY) * 100))
      : 0;

    let bgClass, textClass, occupancyLabel;
    if (!isActive) {
      bgClass = 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600';
      textClass = 'text-slate-400 dark:text-slate-500';
      occupancyLabel = 'Sleep';
    } else if (occupancyPct >= 75) {
      bgClass = 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700';
      textClass = 'text-emerald-700 dark:text-emerald-300';
      occupancyLabel = `${occupancyPct}%`;
    } else {
      bgClass = 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700';
      textClass = 'text-amber-700 dark:text-amber-300';
      occupancyLabel = `${occupancyPct}%`;
    }

    grid.insertAdjacentHTML('beforeend', `
      <div class="relative group ${bgClass} border rounded-xl p-3 flex flex-col items-center justify-center aspect-square cursor-default transition-all hover:scale-105 hover:shadow-md">
        <span class="text-xs font-bold ${textClass}">R${r}</span>
        <span class="text-xs ${textClass} font-mono">${occupancyLabel}</span>
        ${isActive ? `
          <div class="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-current opacity-40 overflow-hidden">
            <div class="h-full rounded-full ${occupancyPct >= 75 ? 'bg-emerald-500' : 'bg-amber-400'}" style="width:${occupancyPct}%"></div>
          </div>
        ` : ''}
      </div>
    `);
  }
}

/* ══════════════════════════════════════════════════
   COMPANY READINESS BARS
══════════════════════════════════════════════════ */
function _renderCompanyBars(byCompany) {
  const container = $('adm-company-bars');
  if (!container) return;
  container.innerHTML = '';

  if (!byCompany || Object.keys(byCompany).length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">No company data.</p>';
    return;
  }

  const sorted = Object.entries(byCompany).sort((a, b) => b[1].avgReadiness - a[1].avgReadiness);

  sorted.forEach(([company, data]) => {
    const pct   = data.avgReadiness;
    const color = pct >= 75 ? 'bg-emerald-500' : pct >= 55 ? 'bg-amber-400' : 'bg-red-400';
    container.insertAdjacentHTML('beforeend', `
      <div>
        <div class="flex justify-between text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
          <span>${company} <span class="text-slate-400 font-normal">(${data.total} students)</span></span>
          <span>${pct}%</span>
        </div>
        <div class="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div class="h-full rounded-full ${color} transition-all duration-700" style="width:${pct}%"></div>
        </div>
      </div>
    `);
  });
}

/* ══════════════════════════════════════════════════
   DEPARTMENT TABLE
══════════════════════════════════════════════════ */
function _renderDeptTable(byDept) {
  const container = $('adm-dept-table');
  if (!container) return;
  container.innerHTML = '';

  if (!byDept || Object.keys(byDept).length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">No department data.</p>';
    return;
  }

  const sorted = Object.entries(byDept).sort((a, b) => b[1].avgReadiness - a[1].avgReadiness);

  container.insertAdjacentHTML('beforeend', `
    <div class="grid grid-cols-4 gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-700">
      <span>Dept</span><span class="text-center">Students</span><span class="text-center">At Risk</span><span class="text-right">Readiness</span>
    </div>
  `);

  sorted.forEach(([dept, data]) => {
    const riskColor      = data.atRisk > 3  ? 'text-terracotta font-bold' : 'text-slate-500 dark:text-slate-400';
    const readinessColor = data.avgReadiness >= 70 ? 'text-emerald-600 dark:text-emerald-400'
                         : data.avgReadiness >= 50 ? 'text-amber-500'
                         : 'text-red-500';

    container.insertAdjacentHTML('beforeend', `
      <div class="grid grid-cols-4 gap-2 py-3 border-b border-slate-50 dark:border-slate-700/50 text-sm items-center hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors rounded-lg px-1">
        <span class="font-semibold text-forest dark:text-white">${dept}</span>
        <span class="text-center text-slate-600 dark:text-slate-300">${data.total}</span>
        <span class="text-center ${riskColor}">${data.atRisk}</span>
        <span class="text-right font-bold ${readinessColor}">${data.avgReadiness}%</span>
      </div>
    `);
  });
}

/* ══════════════════════════════════════════════════
   AT-RISK BOARD
══════════════════════════════════════════════════ */
function _renderAtRiskBoard(atRiskStudents) {
  const container = $('adm-atrisk-list');
  if (!container) return;
  container.innerHTML = '';

  if (!atRiskStudents?.length) {
    container.innerHTML = `
      <div class="text-center py-8 text-slate-400">
        <div class="text-3xl mb-2">✅</div>
        <p class="text-sm font-medium">No students at risk.</p>
      </div>`;
    return;
  }

  atRiskStudents.forEach(student => {
    const severity = student.fatigueIndex >= 130
      ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
      : student.fatigueIndex >= 115
        ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20'
        : 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
    const icon = student.fatigueIndex >= 130 ? '🔴' : student.fatigueIndex >= 115 ? '🟠' : '🟡';

    container.insertAdjacentHTML('beforeend', `
      <div class="flex items-center gap-3 p-3 rounded-xl border ${severity} transition-all">
        <span class="text-lg">${icon}</span>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">${student.name}</p>
          <p class="text-xs text-slate-500">${student.dept} · ${student.targetCompany}</p>
        </div>
        <div class="text-right shrink-0">
          <p class="text-sm font-bold text-terracotta">${student.fatigueIndex}</p>
          <p class="text-xs text-slate-400">fatigue idx</p>
        </div>
      </div>
    `);
  });
}
