/**
 * AssessmentEngine.js — State machine for the full quiz flow
 * Manages: round progression, scoring, XP, streaks, timer, skill score calculation
 */

import { QUESTION_BANK, ROUND_CONFIG } from '../utils/questionBank.js';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class AssessmentEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.rounds = ROUND_CONFIG.map(config => ({
      ...config,
      questions: shuffle(QUESTION_BANK[config.id]).slice(0, config.questionCount),
      answers: [],       // user's answer index for each question
      correct: 0,
      score: 0,          // 0-100 score for this round
      completed: false,
      timeTaken: [],     // seconds taken per question
    }));

    this.currentRoundIndex = 0;
    this.currentQuestionIndex = 0;
    this.totalXP = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.timerValue = 0;
    this.timerInterval = null;
    this.onTick = null;       // callback for timer UI
    this.onExpire = null;     // callback when question time runs out
    this.phase = 'lobby';     // 'lobby' | 'question' | 'roundSummary' | 'finalSummary'
  }

  get currentRound() {
    return this.rounds[this.currentRoundIndex];
  }

  get currentQuestion() {
    return this.currentRound.questions[this.currentQuestionIndex];
  }

  get isLastRound() {
    return this.currentRoundIndex === this.rounds.length - 1;
  }

  get isLastQuestion() {
    return this.currentQuestionIndex === this.currentRound.questions.length - 1;
  }

  get totalQuestions() {
    return this.rounds.reduce((sum, r) => sum + r.questions.length, 0);
  }

  get answeredSoFar() {
    let count = 0;
    for (let i = 0; i < this.currentRoundIndex; i++) {
      count += this.rounds[i].questions.length;
    }
    count += this.currentQuestionIndex;
    return count;
  }

  get overallProgress() {
    return Math.round((this.answeredSoFar / this.totalQuestions) * 100);
  }

  /* ── Timer ──────────────────────────────────────────────── */
  startTimer() {
    this.stopTimer();
    this.timerValue = this.currentRound.timePerQuestion;
    this.timerInterval = setInterval(() => {
      this.timerValue--;
      this.onTick?.(this.timerValue, this.currentRound.timePerQuestion);
      if (this.timerValue <= 0) {
        this.stopTimer();
        this.onExpire?.();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /* ── Answer submission ──────────────────────────────────── */
  submitAnswer(choiceIndex) {
    this.stopTimer();
    const q = this.currentQuestion;
    const round = this.currentRound;
    const isCorrect = choiceIndex === q.correct;
    const timeUsed = round.timePerQuestion - this.timerValue;

    round.answers.push(choiceIndex);
    round.timeTaken.push(timeUsed);

    if (isCorrect) {
      round.correct++;
      this.streak++;
      if (this.streak > this.maxStreak) this.maxStreak = this.streak;

      // XP: base + streak bonus
      const streakBonus = Math.min(this.streak - 1, 5) * 3;
      this.totalXP += round.xpPerCorrect + streakBonus;
    } else {
      this.streak = 0;
    }

    return { isCorrect, correctIndex: q.correct, explanation: q.explanation };
  }

  /* ── Navigation ─────────────────────────────────────────── */
  nextQuestion() {
    if (this.isLastQuestion) {
      this._finalizeRound();
      return 'roundEnd';
    }
    this.currentQuestionIndex++;
    return 'nextQuestion';
  }

  nextRound() {
    if (this.isLastRound) {
      this.phase = 'finalSummary';
      return 'complete';
    }
    this.currentRoundIndex++;
    this.currentQuestionIndex = 0;
    this.phase = 'question';
    return 'nextRound';
  }

  _finalizeRound() {
    const round = this.currentRound;
    round.score = Math.round((round.correct / round.questions.length) * 100);
    round.completed = true;
    this.phase = 'roundSummary';
  }

  /* ── Final Score → Skill Vector ─────────────────────────── */
  getSkillScores() {
    const byRound = {};
    this.rounds.forEach(r => { byRound[r.id] = r.score; });

    // Map rounds to the 4 SkillMatrixEngine dimensions:
    // [CoreLogic, DataStructures, Algorithms, SystemDesign]
    return [
      Math.round((byRound.aptitude  * 0.5) + (byRound.technical * 0.5)),  // Core Logic
      Math.round((byRound.technical * 0.6) + (byRound.coding    * 0.4)),  // Data Structures
      Math.round((byRound.coding    * 0.6) + (byRound.technical * 0.4)),  // Algorithms
      Math.round((byRound.hr        * 0.4) + (byRound.technical * 0.6)),  // System Design
    ];
  }

  getFinalSummary() {
    const totalCorrect = this.rounds.reduce((s, r) => s + r.correct, 0);
    const totalPossible = this.rounds.reduce((s, r) => s + r.questions.length, 0);
    const overallPct = Math.round((totalCorrect / totalPossible) * 100);

    let grade, gradeColor;
    if (overallPct >= 85)      { grade = 'S'; gradeColor = 'text-yellow-500'; }
    else if (overallPct >= 70) { grade = 'A'; gradeColor = 'text-emerald-500'; }
    else if (overallPct >= 55) { grade = 'B'; gradeColor = 'text-blue-500'; }
    else if (overallPct >= 40) { grade = 'C'; gradeColor = 'text-orange-500'; }
    else                       { grade = 'D'; gradeColor = 'text-red-500'; }

    return {
      totalCorrect,
      totalPossible,
      overallPct,
      totalXP: this.totalXP,
      maxStreak: this.maxStreak,
      grade,
      gradeColor,
      rounds: this.rounds.map(r => ({
        label: r.label,
        icon: r.icon,
        correct: r.correct,
        total: r.questions.length,
        score: r.score,
        gradient: r.gradient,
        textColor: r.textColor,
      })),
      skillScores: this.getSkillScores(),
    };
  }
}
