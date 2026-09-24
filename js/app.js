/**
 * app.js — AppController
 * Wires the three pure-logic engines to the DOM.
 * Manages SPA state routing (Home -> Login -> Onboarding -> Dashboard -> Admin).
 */

import { SkillMatrixEngine, DEFAULT_COMPANY_BENCHMARKS } from './engines/SkillMatrixEngine.js';
import { ResourceRouter }     from './engines/ResourceRouter.js';
import { StressSentinel }     from './engines/StressSentinel.js';
import { initCanvasAnimation} from './animation.js';
import { generateStudentCohort, getAdminStats } from './utils/mockData.js';
import { startAssessment }    from './assessment.js';
import { sound }              from './utils/soundEngine.js';
import { RoadmapEngine }      from './engines/RoadmapEngine.js';
import { RoomController }     from './engines/RoomController.js';
import { WellnessEngine }     from './engines/WellnessEngine.js';
import { CodeRunnerEngine, CODING_CHALLENGES } from './engines/CodeRunnerEngine.js';
import { StorageEngine } from './engines/StorageEngine.js';

// Init animation for login view
initCanvasAnimation('ds-canvas');
const dsCanvas = document.getElementById('ds-canvas');

/* ── Constants & Dictionaries ───────────────────────────────── */
const TOTAL_ROOMS     = 10;
const CAPACITY_ROOM   = 5;
const KWH_PER_ROOM    = 2.5;

const companyTargets = {
  'Google':    [95, 90, 95, 90],
  'Amazon':    [85, 90, 90, 90],
  'Microsoft': [90, 90, 90, 85],
  'Zoho':      [95, 80, 85, 80],
  'Zapro':     [80, 90, 75, 85],
  'TCS':       [70, 70, 70, 70]
};

/* ── Singleton engines ──────────────────────────────────────── */
const skillEngine    = new SkillMatrixEngine();
const resourceEngine = new ResourceRouter();
const sentinelEngine = new StressSentinel();
const roadmapEngine  = new RoadmapEngine();
const roomController = new RoomController(TOTAL_ROOMS);
const wellnessEngine = new WellnessEngine();
const codeEngine     = new CodeRunnerEngine();
const storageEngine  = new StorageEngine();

/* ── DOM refs ───────────────────────────────────────────────── */
const $  = id => document.getElementById(id);

// Views
const viewHome        = $('view-home');
const viewLogin       = $('view-login');
const viewOnboarding  = $('view-onboarding');
const viewAssessment  = $('view-assessment');
const viewDashboard   = $('view-dashboard');
const viewAdmin       = $('view-admin');

// Navigation / Main
const mainContent     = $('main-content');
const btnNavStudent   = $('btn-nav-student');
const btnNavAdmin     = $('btn-nav-admin');
const logoLink        = $('logo-link');
const loginHeading    = $('login-heading');
const btnBackHome     = $('btn-back-home');

// Theme Toggle
const btnThemeToggle  = $('btn-theme-toggle');
const themeIconLight  = $('theme-icon-light');
const themeIconDark   = $('theme-icon-dark');

// Auth
const btnLogin        = $('btn-login');

// Onboarding
const sliderLogic     = $('slider-logic');
const sliderDS        = $('slider-ds');
const sliderAlgo      = $('slider-algo');
const sliderSys       = $('slider-sys');
const valLogic        = $('val-logic');
const valDS           = $('val-ds');
const valAlgo         = $('val-algo');
const valSys          = $('val-sys');
const selectCompany   = $('select-company');
const btnCompleteOnboard = $('btn-complete-onboard');

// Student Dashboard
const dashCompanyName = $('dash-company-name');
const sdg4Score     = $('ui-sdg4-score');
const sdg4List      = $('ui-sdg4-list');
const sdg11Energy   = $('ui-sdg11-energy');
const sdg11Grid     = $('ui-sdg11-grid');
const sdg11Spillover= $('ui-sdg11-spillover');
const sdg3Bar       = $('ui-sdg3-bar');
const sdg3Index     = $('ui-sdg3-index');
const sdg3Pct       = $('ui-sdg3-pct');
const sdg3Track     = sdg3Bar?.parentElement;
const lockoutModal  = $('ui-lockout-modal');
const lockoutDisplay= $('lockout-fatigue-display');

// Admin state
let isAdminMode = false;
let adminRefreshInterval = null;

/* ── Theme Routing ──────────────────────────────────────────── */
let isDark = false;
function toggleTheme() {
  isDark = !isDark;
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
  sound.playClick();
});


/* ── State Routing ──────────────────────────────────────────── */
function hideAllViews() {
  viewHome?.classList.add('hidden');
  viewHome?.classList.remove('flex');

  viewLogin?.classList.add('hidden');
  viewLogin?.classList.remove('flex', 'flex-row');

  viewOnboarding?.classList.add('hidden');
  viewOnboarding?.classList.remove('flex', 'flex-col');

  viewAssessment?.classList.add('hidden');
  viewAssessment?.classList.remove('flex', 'flex-col');

  viewDashboard?.classList.add('hidden');
  viewDashboard?.classList.remove('block');

  viewAdmin?.classList.add('hidden');
  viewAdmin?.classList.remove('block');

  mainContent?.classList.remove('no-padding');

  // Stop admin refresh if navigating away
  if (adminRefreshInterval) {
    clearInterval(adminRefreshInterval);
    adminRefreshInterval = null;
  }
}

logoLink?.addEventListener('click', () => {
  isAdminMode = false;
  hideAllViews();
  viewHome?.classList.remove('hidden');
  viewHome?.classList.add('flex');
});

btnBackHome?.addEventListener('click', (e) => {
  e.preventDefault();
  isAdminMode = false;
  hideAllViews();
  viewHome?.classList.remove('hidden');
  viewHome?.classList.add('flex');
});

btnNavStudent?.addEventListener('click', () => {
  isAdminMode = false;
  hideAllViews();
  if (loginHeading) loginHeading.textContent = 'Login to your account';
  if (dsCanvas && dsCanvas.setMode) dsCanvas.setMode('student');
  viewLogin?.classList.remove('hidden');
  viewLogin?.classList.add('flex', 'flex-row');
  mainContent?.classList.add('no-padding');
});

btnNavAdmin?.addEventListener('click', () => {
  isAdminMode = true;
  hideAllViews();
  if (loginHeading) loginHeading.textContent = 'Admin Login';
  if (dsCanvas && dsCanvas.setMode) dsCanvas.setMode('admin');
  viewLogin?.classList.remove('hidden');
  viewLogin?.classList.add('flex', 'flex-row');
  mainContent?.classList.add('no-padding');
});

btnLogin?.addEventListener('click', () => {
  hideAllViews();
  if (isAdminMode) {
    // Go to admin dashboard
    viewAdmin?.classList.remove('hidden');
    viewAdmin?.classList.add('block');
    renderAdminDashboard();
    // Auto-refresh every 30s
    adminRefreshInterval = setInterval(renderAdminDashboard, 30000);
  } else {
    // Go to student onboarding
    viewOnboarding?.classList.remove('hidden');
    viewOnboarding?.classList.add('flex', 'flex-col');
  }
});

// Admin manual refresh
$('btn-admin-refresh')?.addEventListener('click', renderAdminDashboard);

// Update slider labels dynamically
[
  { slider: sliderLogic, val: valLogic },
  { slider: sliderDS, val: valDS },
  { slider: sliderAlgo, val: valAlgo },
  { slider: sliderSys, val: valSys },
].forEach(item => {
  item.slider?.addEventListener('input', (e) => {
    item.val.textContent = `${e.target.value}%`;
  });
});

selectCompany?.addEventListener('change', () => {
  if (selectCompany.value) {
    btnCompleteOnboard.disabled = false;
  }
});

btnCompleteOnboard?.addEventListener('click', () => {
  const company = selectCompany.value;
  hideAllViews();
  viewAssessment?.classList.remove('hidden');
  viewAssessment?.classList.add('flex', 'flex-col');
  // Start the gamified assessment, passing company for context
  startAssessment(company);
});

// After assessment completes, route to dashboard with computed skill scores
window.addEventListener('assessment-complete', (e) => {
  const { skillScores, company } = e.detail;
  hideAllViews();
  viewDashboard?.classList.remove('hidden');
  viewDashboard?.classList.add('block');
  if (dashCompanyName) dashCompanyName.textContent = company;
  // Use assessment-computed scores instead of slider values
  runEnginesAndRenderWithScores(skillScores, company);
});

// On app load, attempt to restore previous session
const savedSession = storageEngine.load();
if (savedSession && savedSession.skillScores && savedSession.company) {
  hideAllViews();
  viewDashboard?.classList.remove('hidden');
  viewDashboard?.classList.add('block');
  if (dashCompanyName) dashCompanyName.textContent = savedSession.company;
  runEnginesAndRenderWithScores(savedSession.skillScores, savedSession.company);
}

/* ══════════════════════════════════════════════════
   ADMIN DASHBOARD
══════════════════════════════════════════════════ */
function renderAdminDashboard() {
  const cohort = generateStudentCohort(120);
  const stats = getAdminStats(cohort);

  // KPI cards
  const admTotal    = $('adm-total');
  const admActive   = $('adm-active');
  const admReadiness= $('adm-readiness');
  const admAtRisk   = $('adm-atrisk');
  const admAtRiskGlow = $('adm-atrisk-glow');

  if (admTotal)    admTotal.textContent    = stats.total;
  if (admActive)   admActive.textContent   = stats.active;
  if (admReadiness) {
    // strip the % span and set only number
    const span = admReadiness.querySelector('span');
    admReadiness.childNodes[0].textContent = stats.avgReadiness;
  }
  if (admAtRisk) {
    admAtRisk.textContent = stats.atRisk;
    admAtRiskGlow?.classList.toggle('hidden', stats.atRisk === 0);
  }

  // Energy (SDG 11)
  const admEnergy = $('adm-energy');
  if (admEnergy) admEnergy.textContent = stats.campus.energySaved;

  // Campus heat map
  renderHeatMap(stats);

  // Company readiness bars
  renderCompanyBars(stats.byCompany);

  // Department table
  renderDeptTable(stats.byDept);

  // At-risk alert board
  renderAtRiskBoard(stats.atRiskStudents);
}

function renderHeatMap({ campus, active }) {
  const grid = $('adm-room-heatmap');
  if (!grid) return;
  grid.innerHTML = '';

  const CAPACITY = 12;
  const studentsPerRoom = active / Math.max(1, campus.activeRooms);

  for (let r = 1; r <= campus.TOTAL_ROOMS; r++) {
    const isActive = r <= campus.activeRooms;
    const occupancyPct = isActive ? Math.min(100, Math.round((studentsPerRoom / CAPACITY) * 100)) : 0;

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

function renderCompanyBars(byCompany) {
  const container = $('adm-company-bars');
  if (!container) return;
  container.innerHTML = '';
  const sorted = Object.entries(byCompany).sort((a, b) => b[1].avgReadiness - a[1].avgReadiness);

  sorted.forEach(([company, data]) => {
    const pct = data.avgReadiness;
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

function renderDeptTable(byDept) {
  const container = $('adm-dept-table');
  if (!container) return;
  container.innerHTML = '';

  const sorted = Object.entries(byDept).sort((a, b) => b[1].avgReadiness - a[1].avgReadiness);

  // Header
  container.insertAdjacentHTML('beforeend', `
    <div class="grid grid-cols-4 gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-700">
      <span>Dept</span><span class="text-center">Students</span><span class="text-center">At Risk</span><span class="text-right">Readiness</span>
    </div>
  `);

  sorted.forEach(([dept, data]) => {
    const riskColor = data.atRisk > 3 ? 'text-terracotta font-bold' : 'text-slate-500 dark:text-slate-400';
    const readinessColor = data.avgReadiness >= 70 ? 'text-emerald-600 dark:text-emerald-400' : data.avgReadiness >= 50 ? 'text-amber-500' : 'text-red-500';

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

function renderAtRiskBoard(atRiskStudents) {
  const container = $('adm-atrisk-list');
  if (!container) return;
  container.innerHTML = '';

  if (atRiskStudents.length === 0) {
    container.innerHTML = `<div class="text-center py-8 text-slate-400"><div class="text-3xl mb-2">✅</div><p class="text-sm font-medium">No students at risk.</p></div>`;
    return;
  }

  atRiskStudents.forEach(student => {
    const severity = student.fatigueIndex >= 130 ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
      : student.fatigueIndex >= 115 ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20'
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

/* ══════════════════════════════════════════════════
   STUDENT DASHBOARD & ENGINES
══════════════════════════════════════════════════ */
let currentFatigueValue = 40;
let currentSkillScores = [50, 50, 50, 50];
let currentCompanyTarget = 'TCS';

function runEnginesAndRenderWithScores(skillScores, company) {
  currentSkillScores = skillScores;
  currentCompanyTarget = company;

  const compConfig = DEFAULT_COMPANY_BENCHMARKS[company] || DEFAULT_COMPANY_BENCHMARKS['TCS'];
  const targetSkills = compConfig.targets;
  const weights = compConfig.weights;

  const avgSkill = skillScores.reduce((a, b) => a + b, 0) / skillScores.length;
  // Persist session data
  storageEngine.save({ skillScores, company });
  const scoreHistory = [
    Math.round(avgSkill + 5), Math.round(avgSkill),
    Math.round(avgSkill - 5), Math.round(avgSkill - 20)
  ];
  const sdg4Result  = skillEngine.calculateGaps(skillScores, targetSkills, weights);
  const sdg3Result  = sentinelEngine.analyzeFatigue(scoreHistory, 4);

  renderSDG4(sdg4Result, targetSkills);
  updateSDG11MetricsFromController();
  renderSDG3(sdg3Result);
  render7DaySprint(skillScores, company);
}

function runEnginesAndRender() {
  const studentSkills = [
    Number(sliderLogic?.value || 50),
    Number(sliderDS?.value    || 50),
    Number(sliderAlgo?.value  || 50),
    Number(sliderSys?.value   || 50)
  ];

  const targetCompany = selectCompany?.value || 'TCS';
  currentSkillScores = studentSkills;
  currentCompanyTarget = targetCompany;

  const compConfig = DEFAULT_COMPANY_BENCHMARKS[targetCompany] || DEFAULT_COMPANY_BENCHMARKS['TCS'];
  const targetSkills = compConfig.targets;
  const weights = compConfig.weights;

  const avgSkill = studentSkills.reduce((a, b) => a + b, 0) / studentSkills.length;
  const scoreHistory = [
    Math.round(avgSkill + 5),
    Math.round(avgSkill),
    Math.round(avgSkill - 5),
    Math.round(avgSkill - 20)
  ];
  const simulatedContinuousHours = 4;

  const sdg4Result  = skillEngine.calculateGaps(studentSkills, targetSkills, weights);
  const sdg3Result  = sentinelEngine.analyzeFatigue(scoreHistory, simulatedContinuousHours);

  renderSDG4(sdg4Result, targetSkills);
  updateSDG11MetricsFromController();
  renderSDG3(sdg3Result);
  render7DaySprint(studentSkills, targetCompany);
}

/* ── UI Renderers ───────────────────────────────────────────── */
function gapClass(gap, target) {
  if (gap === 0)         return 'pm-gap-fill--none';
  const ratio = gap / target;
  if (ratio > 0.4)       return 'pm-gap-fill--high';
  if (ratio > 0.15)      return 'pm-gap-fill--mid';
  return 'pm-gap-fill--low';
}

function renderSDG4({ readinessScore, weightedScore, skillGaps, tiers, priorities }, targetSkills) {
  if (!sdg4Score || !sdg4List) return;
  sdg4Score.textContent = readinessScore;
  const metric = sdg4Score.closest('.pm-metric') ?? sdg4Score.parentElement;
  metric.classList.toggle('pm-metric--terracotta', readinessScore < 60);
  metric.classList.toggle('pm-metric--forest',     readinessScore >= 60);

  sdg4List.innerHTML = '';
  const labels = ['Core Logic', 'Data Structures', 'Algorithms', 'System Design'];

  skillGaps.forEach((gap, i) => {
    const target   = targetSkills[i] ?? 100;
    const fillPct  = Math.min(100, Math.round((gap / target) * 100));
    const modifier = gapClass(gap, target);
    const label    = labels[i];
    const tier     = tiers && tiers[i] ? tiers[i] : { tier: 'COMPETENT', badgeClass: 'bg-emerald-100 text-emerald-800' };
    const priority = priorities && priorities.find(p => p.skill === label);
    const effortText = priority && priority.estimatedHours > 0 ? `· ~${priority.estimatedHours}h practice` : '';
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

function updateSDG11MetricsFromController() {
  const metrics = roomController.getMetrics();
  if (sdg11Energy) sdg11Energy.textContent = metrics.energySavedKWh;

  const co2El = $('ui-sdg11-co2');
  const costEl = $('ui-sdg11-cost');
  if (co2El) co2El.textContent = `${metrics.co2AvoidedKg} kg`;
  if (costEl) costEl.textContent = `₹${metrics.costSaved}`;

  if (sdg11Grid) {
    sdg11Grid.innerHTML = '';
    metrics.rooms.forEach(r => {
      const isActive = r.status === 'active';
      const pill = document.createElement('div');
      pill.className = `pm-room-pill ${isActive ? 'pm-room-pill--active' : 'pm-room-pill--sleep'}`;
      pill.textContent = `R${r.id}`;
      pill.title = `Click to inspect ${r.name} (${r.status})`;
      pill.addEventListener('click', () => openRoomInspector(r.id));
      sdg11Grid.appendChild(pill);
    });
  }

  if (sdg11Spillover) {
    sdg11Spillover.style.display = 'none';
  }
}

const FATIGUE_MAX_DISPLAY = 150;
function renderSDG3({ lockoutRequired, fatigueIndex }) {
  currentFatigueValue = fatigueIndex;
  if (!sdg3Index || !sdg3Bar) return;
  sdg3Index.textContent = fatigueIndex.toFixed(1);
  const pct = Math.min(100, Math.round((fatigueIndex / FATIGUE_MAX_DISPLAY) * 100));
  sdg3Bar.style.width = `${pct}%`;
  if (sdg3Pct) sdg3Pct.textContent = `${pct}%`;
  sdg3Track?.setAttribute('aria-valuenow', fatigueIndex.toFixed(1));

  if (fatigueIndex > 75) {
    sdg3Bar.style.background = 'linear-gradient(90deg, #D96B43, #B8532E)';
  } else {
    sdg3Bar.style.background = 'linear-gradient(90deg, #F5A623, #D96B43)';
  }

  if (lockoutRequired) {
    triggerLockout(fatigueIndex);
  }
}

/* ── Lockout ────────────────────────────────────────────────── */
function triggerLockout(fatigueIndex) {
  if (lockoutDisplay) lockoutDisplay.textContent = fatigueIndex.toFixed(1);
  lockoutModal?.classList.remove('hidden');
  document.body.classList.add('locked');
  document.addEventListener('keydown', trapKeyboard, true);
  lockoutModal?.addEventListener('click', e => e.stopPropagation());
}

function trapKeyboard(e) {
  if (e.key === 'Escape' || e.key === 'Tab') {
    e.preventDefault();
    e.stopPropagation();
  }
}

/* ══════════════════════════════════════════════════
   PERSONALIZED 7-DAY SPRINT (SDG 4)
══════════════════════════════════════════════════ */
function render7DaySprint(skillScores, company) {
  const sprint = roadmapEngine.generateSprint(skillScores, company);
  const container = $('sprint-days-container');
  if (!container) return;

  container.innerHTML = '';
  updateSprintProgress(0, 7);

  sprint.forEach((dayPlan) => {
    const card = document.createElement('div');
    card.className = 'bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-5 border border-gray-200 dark:border-slate-700/80 flex flex-col justify-between hover:shadow-md transition-all group';
    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between mb-3">
          <span class="w-8 h-8 rounded-full bg-forest dark:bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            D${dayPlan.day}
          </span>
          <span class="text-[10px] font-bold px-2.5 py-1 rounded-full ${dayPlan.tagColor}">
            ${dayPlan.tag}
          </span>
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
      openPrepLab('twoSum');
    });

    card.querySelectorAll('.sprint-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) {
          sound.playCorrect();
        } else {
          sound.playClick();
        }
        recalcSprintProgress();
      });
    });

    container.appendChild(card);
  });
}

function recalcSprintProgress() {
  const checkboxes = document.querySelectorAll('.sprint-checkbox');
  const checked = document.querySelectorAll('.sprint-checkbox:checked').length;
  const total = checkboxes.length;
  const dayEquivalent = Math.round((checked / Math.max(1, total)) * 7);
  updateSprintProgress(dayEquivalent, 7);
}

function updateSprintProgress(done, total) {
  const txt = $('sprint-progress-text');
  const pct = $('sprint-pct');
  const percentage = Math.round((done / total) * 100);
  if (txt) txt.textContent = `${done} / ${total} Days`;
  if (pct) pct.textContent = `${percentage}%`;
}

/* ══════════════════════════════════════════════════
   PREPLAB LIVE SANDBOX (IDE)
══════════════════════════════════════════════════ */
let currentChallengeKey = 'twoSum';

function openPrepLab(challengeKey = 'twoSum') {
  currentChallengeKey = challengeKey;
  const challenge = CODING_CHALLENGES[challengeKey] || CODING_CHALLENGES.twoSum;
  const modal = $('modal-preplab');
  const title = $('preplab-title');
  const desc = $('preplab-desc');
  const diff = $('preplab-diff');
  const editor = $('preplab-editor');
  const select = $('preplab-challenge-select');
  const results = $('preplab-results');

  if (title) title.textContent = challenge.title;
  if (desc) desc.textContent = challenge.description;
  if (diff) diff.textContent = challenge.difficulty.toUpperCase();
  if (editor) editor.value = challenge.starterCode;
  if (select) select.value = challengeKey;
  if (results) results.classList.add('hidden');

  modal?.classList.remove('hidden');
  sound.playClick();
}

$('btn-nav-preplab')?.addEventListener('click', () => openPrepLab('twoSum'));
$('btn-open-preplab')?.addEventListener('click', () => openPrepLab('twoSum'));

$('preplab-challenge-select')?.addEventListener('change', (e) => {
  openPrepLab(e.target.value);
});

$('btn-close-preplab')?.addEventListener('click', () => {
  $('modal-preplab')?.classList.add('hidden');
  sound.playClick();
});

$('btn-run-code')?.addEventListener('click', () => {
  const code = $('preplab-editor')?.value || '';
  const outcome = codeEngine.execute(code, currentChallengeKey);
  const resultsContainer = $('preplab-cases-container');
  const speedEl = $('preplab-speed');
  const resultsBox = $('preplab-results');

  if (resultsBox) resultsBox.classList.remove('hidden');
  if (speedEl) speedEl.textContent = `${outcome.totalTimeMs}ms`;

  if (resultsContainer) {
    resultsContainer.innerHTML = '';
    if (!outcome.success) {
      sound.playWrong();
      resultsContainer.innerHTML = `
        <div class="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 font-mono text-xs">
          <strong>Runtime Exception:</strong> ${outcome.error}
        </div>
      `;
    } else {
      if (outcome.allPassed) {
        sound.playCelebration();
      } else {
        sound.playWrong();
      }

      outcome.results.forEach(res => {
        resultsContainer.insertAdjacentHTML('beforeend', `
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
});

/* ══════════════════════════════════════════════════
   ROOM INSPECTOR & SDG 11 CONTROLLER
══════════════════════════════════════════════════ */
let selectedRoomId = 1;

function openRoomInspector(roomId) {
  selectedRoomId = Number(roomId);
  const room = roomController.rooms.find(r => r.id === selectedRoomId);
  if (!room) return;

  $('inspector-room-name').textContent = room.name;
  $('inspector-room-floor').textContent = room.floor;
  $('inspector-status-badge').textContent = room.status === 'active' ? 'Active Occupancy' : 'Hibernating (Standby)';
  $('inspector-status-badge').className = `font-bold text-sm mt-0.5 ${room.status === 'active' ? 'text-emerald-500' : 'text-slate-400'}`;
  $('inspector-occupancy').textContent = `${room.occupants} / ${room.capacity} Candidates`;
  $('inspector-power').textContent = `${room.hvacPowerKW} kW`;
  $('inspector-temp').textContent = `${room.tempCelsius}°C`;
  $('inspector-aqi').textContent = room.airQuality;

  $('modal-room-inspector')?.classList.remove('hidden');
  sound.playClick();
}

$('btn-close-inspector')?.addEventListener('click', () => {
  $('modal-room-inspector')?.classList.add('hidden');
  sound.playClick();
});

$('btn-toggle-room-state')?.addEventListener('click', () => {
  const updatedRoom = roomController.toggleRoom(selectedRoomId);
  if (updatedRoom) {
    sound.playClick();
    openRoomInspector(selectedRoomId);
    updateSDG11MetricsFromController();
  }
});

/* ══════════════════════════════════════════════════
   WELLNESS & MINDFUL BIO-BREAK (SDG 3)
══════════════════════════════════════════════════ */
function openWellnessModal() {
  $('modal-wellness')?.classList.remove('hidden');
  const instruction = $('wellness-instruction');
  const phaseTimer = $('wellness-phase-timer');
  const timeLeft = $('wellness-time-left');

  wellnessEngine.startSession(
    (remaining) => {
      if (timeLeft) timeLeft.textContent = `${remaining}s`;
    },
    (phase, cycleSec) => {
      if (phase === 'inhale') {
        if (instruction) instruction.textContent = 'Inhale deeply...';
        if (phaseTimer) phaseTimer.textContent = `${4 - (cycleSec % 4)}s`;
      } else if (phase === 'hold') {
        if (instruction) instruction.textContent = 'Hold your breath...';
        if (phaseTimer) phaseTimer.textContent = `${11 - cycleSec}s`;
      } else {
        if (instruction) instruction.textContent = 'Exhale slowly...';
        if (phaseTimer) phaseTimer.textContent = `${19 - cycleSec}s`;
      }
    },
    () => {
      completeWellnessBreak();
    }
  );
}

function completeWellnessBreak() {
  wellnessEngine.stopSession();
  $('modal-wellness')?.classList.add('hidden');

  // De-escalate fatigue index by 25-30 pts
  currentFatigueValue = Math.max(15, currentFatigueValue - 28);
  renderSDG3({ lockoutRequired: false, fatigueIndex: currentFatigueValue });

  // Lift lockout if active
  lockoutModal?.classList.add('hidden');
  document.body.classList.remove('locked');
  document.removeEventListener('keydown', trapKeyboard, true);

  sound.playCorrect();
}

$('btn-open-wellness')?.addEventListener('click', openWellnessModal);
$('btn-trigger-wellness')?.addEventListener('click', openWellnessModal);
$('btn-lockout-recovery')?.addEventListener('click', () => {
  lockoutModal?.classList.add('hidden');
  document.body.classList.remove('locked');
  openWellnessModal();
});
$('btn-close-wellness')?.addEventListener('click', () => {
  wellnessEngine.stopSession();
  $('modal-wellness')?.classList.add('hidden');
  sound.playClick();
});
$('btn-finish-wellness')?.addEventListener('click', completeWellnessBreak);

/* ══════════════════════════════════════════════════
   OFFICIAL CREDENTIAL CERTIFICATE (SDG 8 & SDG 4)
══════════════════════════════════════════════════ */
function openCertificateModal(score = 85, company = 'TCS') {
  const modal = $('modal-certificate');
  const targetEl = $('cert-company-target');
  const scoreEl = $('cert-readiness');
  const gradeEl = $('cert-grade');
  const hashEl = $('cert-hash');

  const grade = score >= 90 ? 'Grade S+' : score >= 80 ? 'Grade A' : score >= 70 ? 'Grade B' : 'Grade C';
  const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();

  if (targetEl) targetEl.textContent = `${company} Placement Standards`;
  if (scoreEl) scoreEl.textContent = `${score}%`;
  if (gradeEl) gradeEl.textContent = grade;
  if (hashEl) hashEl.textContent = `PM-2026-${randomHex}-SDG`;

  modal?.classList.remove('hidden');
  sound.playCelebration();
}

$('btn-open-certificate')?.addEventListener('click', () => {
  const score = parseInt($('ui-sdg4-score')?.textContent) || 85;
  const company = currentCompanyTarget || 'TCS';
  openCertificateModal(score, company);
});

$('btn-close-certificate')?.addEventListener('click', () => {
  $('modal-certificate')?.classList.add('hidden');
  sound.playClick();
});

$('btn-print-certificate')?.addEventListener('click', () => {
  window.print();
});

