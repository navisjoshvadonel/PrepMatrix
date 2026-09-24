/**
 * assessment.js — Gamified Assessment UI Controller
 * Drives the entire quiz experience: lobby → questions → round summary → final result
 */

import { AssessmentEngine } from './engines/AssessmentEngine.js';
import { ROUND_CONFIG } from './utils/questionBank.js';
import { sound } from './utils/soundEngine.js';

let engine = null;
let feedbackTimeout = null;

/* ── DOM refs ───────────────────────────────────────────────── */
const $  = id => document.getElementById(id);

// Phases
const phaseLobby        = $('assess-lobby');
const phaseQuestion     = $('assess-question');
const phaseRoundSummary = $('assess-round-summary');
const phaseFinal        = $('assess-final');

// Header bar
const hdrRoundLabel     = $('hdr-round-label');
const hdrRoundIcon      = $('hdr-round-icon');
const hdrQNum           = $('hdr-q-num');
const hdrXP             = $('hdr-xp');
const hdrStreak         = $('hdr-streak');
const hdrProgress       = $('hdr-progress-bar');
const hdrProgressPct    = $('hdr-progress-pct');

// Question area
const timerArc          = $('timer-arc');
const timerText         = $('timer-text');
const timerCircle       = $('timer-circle');
const qRoundTag         = $('q-round-tag');
const qDiffTag          = $('q-diff-tag');
const qText             = $('q-text');
const qCode             = $('q-code');
const qOptionsGrid      = $('q-options-grid');
const qExplanation      = $('q-explanation');
const qExplText         = $('q-expl-text');
const btnNext           = $('btn-assess-next');
const streakBanner      = $('streak-banner');
const streakCount       = $('streak-count-display');

/* ── Show/hide assessment phases ────────────────────────────── */
function showPhase(name) {
  [phaseLobby, phaseQuestion, phaseRoundSummary, phaseFinal]
    .forEach(el => el?.classList.add('hidden'));
  const target = { lobby: phaseLobby, question: phaseQuestion, roundSummary: phaseRoundSummary, final: phaseFinal }[name];
  target?.classList.remove('hidden');
}

/* ══════════════════════════════════════════════════
   PUBLIC: init from app.js
══════════════════════════════════════════════════ */
export function startAssessment(company) {
  engine = new AssessmentEngine();
  engine.targetCompany = company;
  showPhase('lobby');
  renderLobby();
}

/* ══════════════════════════════════════════════════
   LOBBY
══════════════════════════════════════════════════ */
function renderLobby() {
  const lobbyRounds = $('lobby-rounds');
  if (!lobbyRounds) return;
  lobbyRounds.innerHTML = '';

  ROUND_CONFIG.forEach((r, i) => {
    lobbyRounds.insertAdjacentHTML('beforeend', `
      <div class="flex items-center gap-4 p-4 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-700 backdrop-blur-sm hover:shadow-md transition-all group animate-slide-up" style="opacity:0; animation-delay:${0.1 + i * 0.08}s;">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br ${r.gradient} flex items-center justify-center text-2xl shadow-md flex-shrink-0 group-hover:scale-110 transition-transform">${r.icon}</div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-0.5">
            <h4 class="font-bold text-forest dark:text-white text-base">${r.label}</h4>
            <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">${r.questionCount} Qs · ${r.timePerQuestion}s each</span>
          </div>
          <p class="text-xs text-gray-500 dark:text-slate-400">${r.description}</p>
        </div>
        <div class="text-right flex-shrink-0">
          <p class="text-base font-bold text-forest dark:text-white">+${r.xpPerCorrect} XP</p>
          <p class="text-xs text-slate-400">per correct</p>
        </div>
      </div>
    `);
  });

  $('btn-start-assessment')?.addEventListener('click', beginAssessment, { once: true });
}

function beginAssessment() {
  engine.phase = 'question';
  showPhase('question');
  renderQuestion();
}

/* ══════════════════════════════════════════════════
   QUESTION RENDER
══════════════════════════════════════════════════ */
function renderQuestion() {
  const round = engine.currentRound;
  const q = engine.currentQuestion;
  const qNum = engine.currentQuestionIndex + 1;
  const totalQ = round.questions.length;

  // Header bar
  if (hdrRoundLabel) hdrRoundLabel.textContent = round.label;
  if (hdrRoundIcon)  hdrRoundIcon.textContent  = round.icon;
  if (hdrQNum)       hdrQNum.textContent        = `Q${qNum} of ${totalQ}`;
  updateXPStreak();
  updateOverallProgress();

  // Round / difficulty tags
  if (qRoundTag) {
    qRoundTag.textContent  = round.label;
    qRoundTag.className = `inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${round.gradient} text-white shadow-sm`;
  }
  if (qDiffTag) {
    const diffColors = { easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', hard: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' };
    qDiffTag.textContent = q.difficulty.toUpperCase();
    qDiffTag.className = `inline-flex px-3 py-1 rounded-full text-xs font-bold ${diffColors[q.difficulty]}`;
  }

  // Question text
  if (qText) qText.textContent = q.isCode ? q.question.split('\n\n')[0] : q.question;

  // Code block
  if (qCode) {
    if (q.isCode) {
      const codeMatch = q.question.match(/```[\w]*\n([\s\S]*?)```/);
      if (codeMatch) {
        qCode.classList.remove('hidden');
        const codeEl = document.getElementById('q-code-content');
        if (codeEl) codeEl.textContent = codeMatch[1].trim();
      }
    } else {
      qCode.classList.add('hidden');
    }
  }

  // Hide explanation
  if (qExplanation) qExplanation.classList.add('hidden');
  if (btnNext)      btnNext.classList.add('hidden');

  // Options
  renderOptions(q);

  // Timer
  engine.onTick   = updateTimerUI;
  engine.onExpire = handleTimeExpired;
  engine.startTimer();
  updateTimerUI(round.timePerQuestion, round.timePerQuestion);
}

function renderOptions(q, reveal = false) {
  if (!qOptionsGrid) return;
  qOptionsGrid.innerHTML = '';

  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.id = `opt-${idx}`;
    btn.className = `w-full text-left p-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium text-sm transition-all hover:border-forest dark:hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5 flex items-start gap-3 group`;
    btn.innerHTML = `
      <span class="w-7 h-7 flex-shrink-0 rounded-full border-2 border-gray-300 dark:border-slate-600 group-hover:border-forest dark:group-hover:border-emerald-500 flex items-center justify-center text-xs font-bold transition-colors">${String.fromCharCode(65+idx)}</span>
      <span>${opt}</span>
    `;

    if (!reveal) {
      btn.addEventListener('click', () => handleOptionClick(idx));
    } else {
      btn.disabled = true;
      if (idx === q.correct) {
        btn.className = btn.className.replace('border-gray-200 dark:border-slate-700', 'border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30');
        btn.querySelector('span').className = 'w-7 h-7 flex-shrink-0 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold';
        btn.querySelector('span').textContent = '✓';
      }
    }

    qOptionsGrid.appendChild(btn);
  });
}

function handleOptionClick(choiceIdx) {
  // Disable all buttons immediately
  document.querySelectorAll('#q-options-grid button').forEach(b => b.disabled = true);

  const { isCorrect, correctIndex, explanation } = engine.submitAnswer(choiceIdx);

  // Style chosen option
  const chosenBtn = $(`opt-${choiceIdx}`);
  const correctBtn = $(`opt-${correctIndex}`);

  if (isCorrect) {
    chosenBtn.classList.add('border-emerald-500', 'bg-emerald-50', 'dark:bg-emerald-900/30', 'dark:border-emerald-400', 'scale-105');
    const badge = chosenBtn.querySelector('span');
    badge.className = 'w-7 h-7 flex-shrink-0 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold';
    badge.textContent = '✓';
    sound.playCorrect();
    if (engine.streak >= 2) {
      sound.playStreak();
    }
    showStreakBanner();
  } else {
    chosenBtn.classList.add('border-red-400', 'bg-red-50', 'dark:bg-red-900/20', 'dark:border-red-400');
    const wrongBadge = chosenBtn.querySelector('span');
    wrongBadge.className = 'w-7 h-7 flex-shrink-0 rounded-full bg-red-400 text-white flex items-center justify-center text-xs font-bold';
    wrongBadge.textContent = '✗';
    sound.playWrong();

    // Show correct
    correctBtn.classList.add('border-emerald-500', 'bg-emerald-50', 'dark:bg-emerald-900/30', 'dark:border-emerald-400');
    const correctBadge = correctBtn.querySelector('span');
    correctBadge.className = 'w-7 h-7 flex-shrink-0 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold';
    correctBadge.textContent = '✓';

    // Hide streak banner
    if (streakBanner) streakBanner.classList.add('hidden');
  }

  // Show explanation
  if (qExplanation && qExplText) {
    qExplText.textContent = explanation;
    qExplanation.className = qExplanation.className.replace('hidden', '');
    qExplanation.classList.remove('hidden');
    qExplanation.classList.add('animate-slide-up');
  }

  // Update XP display
  updateXPStreak();

  // Show Next button
  if (btnNext) {
    btnNext.classList.remove('hidden');
    btnNext.textContent = engine.isLastQuestion ? (engine.isLastRound ? '🏆 See Final Results' : '📊 Round Summary') : 'Next Question →';
  }
}

function handleTimeExpired() {
  // Treat as wrong answer
  handleOptionClick(-1); // -1 = no selection = wrong
}

/* ── Timer UI ───────────────────────────────────────────────── */
function updateTimerUI(remaining, total) {
  if (!timerText) return;
  timerText.textContent = remaining;

  const pct = remaining / total;
  const color = pct > 0.5 ? '#10B981' : pct > 0.25 ? '#F59E0B' : '#EF4444';

  if (timerCircle) timerCircle.style.stroke = color;
  if (timerText) timerText.style.color = color;

  // SVG arc
  if (timerArc) {
    const circumference = 2 * Math.PI * 28;
    const offset = circumference * (1 - pct);
    timerArc.style.strokeDasharray = circumference;
    timerArc.style.strokeDashoffset = offset;
    timerArc.style.stroke = color;
  }

  // Shake when low
  if (remaining <= 10 && timerText) {
    timerText.parentElement.classList.add('animate-pulse');
  }
  if (remaining <= 5 && remaining > 0) {
    sound.playTick();
  }
}

/* ── Streak Banner ──────────────────────────────────────────── */
function showStreakBanner() {
  if (!streakBanner || engine.streak < 2) return;
  if (streakCount) streakCount.textContent = engine.streak;
  streakBanner.classList.remove('hidden');
  streakBanner.classList.add('animate-scale-in');
  clearTimeout(feedbackTimeout);
  feedbackTimeout = setTimeout(() => streakBanner.classList.add('hidden'), 2000);
}

/* ── Header Updates ─────────────────────────────────────────── */
function updateXPStreak() {
  if (hdrXP)     hdrXP.textContent     = engine.totalXP;
  if (hdrStreak) hdrStreak.textContent = engine.streak > 0 ? `🔥 ${engine.streak}` : '—';
}

function updateOverallProgress() {
  const pct = engine.overallProgress;
  if (hdrProgress)    hdrProgress.style.width = `${pct}%`;
  if (hdrProgressPct) hdrProgressPct.textContent = `${pct}%`;
}

/* ── Next button ────────────────────────────────────────────── */
$('btn-assess-next')?.addEventListener('click', () => {
  const result = engine.nextQuestion();
  if (result === 'roundEnd') {
    renderRoundSummary();
  } else {
    renderQuestion();
  }
});

/* ══════════════════════════════════════════════════
   ROUND SUMMARY
══════════════════════════════════════════════════ */
function renderRoundSummary() {
  showPhase('roundSummary');
  const round = engine.currentRound;

  const rsIcon      = $('rs-icon');
  const rsTitle     = $('rs-title');
  const rsScore     = $('rs-score');
  const rsCorrect   = $('rs-correct');
  const rsXP        = $('rs-xp');
  const rsFeedback  = $('rs-feedback');
  const rsList      = $('rs-question-list');
  const btnNextRound= $('btn-next-round');

  if (rsIcon)    rsIcon.textContent    = round.icon;
  if (rsTitle)   rsTitle.textContent   = `${round.label} Complete!`;
  if (rsScore)   rsScore.textContent   = `${round.score}%`;
  if (rsCorrect) rsCorrect.textContent = `${round.correct} / ${round.questions.length} correct`;

  // XP this round
  const roundXP = round.correct * round.xpPerCorrect;
  if (rsXP) rsXP.textContent = `+${roundXP} XP earned`;

  // Feedback
  if (rsFeedback) {
    rsFeedback.textContent = round.score >= 80 ? '🌟 Excellent work! Dominating this section.'
      : round.score >= 60 ? '👍 Good effort! Review the questions you missed.'
      : '📚 Keep practising — revisit the fundamentals for this section.';
  }

  // Per-question review list
  if (rsList) {
    rsList.innerHTML = '';
    round.questions.forEach((q, i) => {
      const userAns = round.answers[i];
      const isCorrect = userAns === q.correct;
      const unanswered = userAns === -1 || userAns === undefined;
      rsList.insertAdjacentHTML('beforeend', `
        <div class="flex items-start gap-3 p-3 rounded-xl ${isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'} border ${isCorrect ? 'border-emerald-200 dark:border-emerald-800' : 'border-red-200 dark:border-red-800'}">
          <span class="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-400 text-white'}">${isCorrect ? '✓' : '✗'}</span>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold text-slate-700 dark:text-slate-300 line-clamp-2">${q.isCode ? q.question.split('\n\n')[0] : q.question}</p>
            ${!isCorrect ? `<p class="text-xs text-emerald-600 dark:text-emerald-400 mt-1">✓ ${q.options[q.correct]}</p>` : ''}
          </div>
        </div>
      `);
    });
  }

  if (btnNextRound) {
    btnNextRound.textContent = engine.isLastRound ? '🏆 See Final Results' : `Next: ${engine.rounds[engine.currentRoundIndex + 1]?.label} Round →`;
  }

  $('btn-next-round')?.addEventListener('click', () => {
    const result = engine.nextRound();
    if (result === 'complete') {
      renderFinalSummary();
    } else {
      showPhase('question');
      renderQuestion();
    }
  }, { once: true });
}

/* ══════════════════════════════════════════════════
   FINAL SUMMARY
══════════════════════════════════════════════════ */
function renderFinalSummary() {
  showPhase('final');
  sound.playCelebration();
  const s = engine.getFinalSummary();

  const elGrade    = $('final-grade');
  const elPct      = $('final-pct');
  const elXP       = $('final-xp');
  const elStreak   = $('final-streak');
  const elRounds   = $('final-rounds-grid');
  const elSkills   = $('final-skills-list');
  const btnDash    = $('btn-go-dashboard');

  if (elGrade) { elGrade.textContent = s.grade; elGrade.className = `text-8xl font-bold font-display ${s.gradeColor}`; }
  if (elPct)   elPct.textContent   = `${s.overallPct}%`;
  if (elXP)    elXP.textContent    = `${s.totalXP} XP`;
  if (elStreak) elStreak.textContent = `🔥 ${s.maxStreak}`;

  if (elRounds) {
    elRounds.innerHTML = '';
    s.rounds.forEach(r => {
      elRounds.insertAdjacentHTML('beforeend', `
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 text-center hover:shadow-md transition-shadow">
          <div class="text-3xl mb-2">${r.icon}</div>
          <p class="font-bold text-forest dark:text-white text-sm">${r.label}</p>
          <p class="text-2xl font-bold bg-gradient-to-r ${r.gradient} bg-clip-text text-transparent my-1">${r.score}%</p>
          <p class="text-xs text-slate-400">${r.correct}/${r.total} correct</p>
        </div>
      `);
    });
  }

  if (elSkills) {
    const labels = ['Core Logic', 'Data Structures', 'Algorithms', 'System Design'];
    elSkills.innerHTML = '';
    s.skillScores.forEach((score, i) => {
      const color = score >= 75 ? 'bg-emerald-500' : score >= 55 ? 'bg-amber-400' : 'bg-red-400';
      elSkills.insertAdjacentHTML('beforeend', `
        <div>
          <div class="flex justify-between text-sm font-semibold mb-1">
            <span class="text-slate-700 dark:text-slate-300">${labels[i]}</span>
            <span class="text-forest dark:text-white">${score}%</span>
          </div>
          <div class="h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div class="h-full rounded-full ${color} transition-all duration-1000" style="width:0%" data-target="${score}"></div>
          </div>
        </div>
      `);
    });

    // Animate skill bars
    setTimeout(() => {
      elSkills.querySelectorAll('[data-target]').forEach(bar => {
        bar.style.width = bar.dataset.target + '%';
      });
    }, 300);
  }

  // Wire dashboard button to send skill scores back
  if (btnDash) {
    btnDash.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('assessment-complete', {
        detail: {
          skillScores: s.skillScores,
          company: engine.targetCompany,
        }
      }));
    }, { once: true });
  }
}
