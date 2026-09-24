/**
 * SkillMatrixEngine — SDG 4: Quality Education
 * 
 * Enterprise-grade competency gap and readiness evaluation engine.
 * Features:
 *  1. Weighted & unweighted skill gap calculation (aligned with company domain priorities)
 *  2. Competency tier classification (Novice, Developing, Competent, Mastery)
 *  3. Multi-company placement fit probability benchmarking
 *  4. Remediation priority & estimated study effort calculator (hours needed per gap)
 *  5. Learning velocity & trajectory projector
 */

export const SKILL_LABELS = ['Core Logic', 'Data Structures', 'Algorithms', 'System Design'];

export const DEFAULT_COMPANY_BENCHMARKS = {
  'Google':    { targets: [95, 90, 95, 90], weights: [0.10, 0.35, 0.40, 0.15], desc: 'Distributed Systems & Hard Algorithms' },
  'Amazon':    { targets: [85, 90, 90, 90], weights: [0.20, 0.30, 0.25, 0.25], desc: 'Scalability & Leadership Architecture' },
  'Microsoft': { targets: [90, 90, 90, 85], weights: [0.20, 0.35, 0.25, 0.20], desc: 'Data Structures & Clean Architecture' },
  'Zoho':      { targets: [95, 80, 85, 80], weights: [0.45, 0.25, 0.20, 0.10], desc: 'Strict Core Logic & Low-Level Mastery' },
  'Zapro':     { targets: [80, 90, 75, 85], weights: [0.20, 0.25, 0.20, 0.35], desc: 'Full-Stack & Cloud Architecture' },
  'TCS':       { targets: [70, 70, 70, 70], weights: [0.30, 0.25, 0.25, 0.20], desc: 'Foundational SDE & Core Aptitude' }
};

export class SkillMatrixEngine {
  /**
   * Calculates a student's readiness score and per-skill gaps against target proficiency levels.
   * Supports optional skill weights for company-specific prioritization.
   *
   * @param {number[]} studentSkills      - Array of student proficiency scores (0–100)
   * @param {number[]} targetSkills       - Array of target proficiency scores (0–100)
   * @param {number[]|null} [weights=null] - Optional importance weights per skill (sum ~ 1.0)
   * @returns {{
   *   readinessScore: number,
   *   weightedScore: number,
   *   skillGaps: number[],
   *   tiers: Array<{ skill: string, score: number, tier: string, label: string, badgeClass: string }>,
   *   priorities: Array<{ skill: string, gap: number, estimatedHours: number, priority: string }>
   * }}
   *
   * Edge cases handled:
   *  • Either array is empty              → { readinessScore: 0, weightedScore: 0, skillGaps: [], tiers: [], priorities: [] }
   *  • Arrays have mismatched lengths     → { readinessScore: 0, weightedScore: 0, skillGaps: [], tiers: [], priorities: [] }
   *  • Student score EXCEEDS target       → gap clamped to 0 (never negative)
   *  • Non-numeric values in arrays       → treated as 0
   *  • Zero target scores                 → guarded against division by zero (returns 100)
   */
  calculateGaps(studentSkills = [], targetSkills = [], weights = null) {
    // Guard: empty or mismatched
    if (
      !Array.isArray(studentSkills) ||
      !Array.isArray(targetSkills) ||
      studentSkills.length === 0 ||
      targetSkills.length === 0 ||
      studentSkills.length !== targetSkills.length
    ) {
      return {
        readinessScore: 0,
        weightedScore: 0,
        skillGaps: [],
        tiers: [],
        priorities: []
      };
    }

    const n = studentSkills.length;
    let totalGap = 0;
    let totalTarget = 0;
    const skillGaps = [];
    const tiers = [];

    // Normalize weights if provided, or default to equal distribution (1/n)
    let normWeights = [];
    if (Array.isArray(weights) && weights.length === n) {
      const sumW = weights.reduce((acc, w) => acc + (Number(w) || 0), 0) || 1;
      normWeights = weights.map(w => (Number(w) || 0) / sumW);
    } else {
      normWeights = Array(n).fill(1 / n);
    }

    let weightedReadinessSum = 0;

    for (let i = 0; i < n; i++) {
      const student = Math.max(0, Math.min(100, Number(studentSkills[i]) || 0));
      const target  = Math.max(0, Math.min(100, Number(targetSkills[i])  || 0));
      const label   = SKILL_LABELS[i] || `Skill ${i + 1}`;

      // Clamp gap: never return negative values
      const gap = Math.max(0, target - student);
      skillGaps.push(gap);

      totalGap    += gap;
      totalTarget += target;

      // Weighted calculation per dimension:
      const skillReadiness = target === 0 ? 100 : Math.min(100, Math.round((Math.max(0, target - gap) / target) * 100));
      weightedReadinessSum += skillReadiness * normWeights[i];

      // Classify mastery tier
      const tierInfo = this.classifyTier(student);
      tiers.push({
        skill: label,
        score: student,
        target,
        gap,
        ...tierInfo
      });
    }

    // Unweighted standard score for backward compatibility
    const readinessScore =
      totalTarget === 0
        ? 100
        : Math.round(((totalTarget - totalGap) / totalTarget) * 100);

    const weightedScore = Math.round(weightedReadinessSum);

    // Remediation priority & estimated effort calculation
    const priorities = this.calculateStudyEffort(skillGaps, normWeights);

    return {
      readinessScore,
      weightedScore,
      skillGaps,
      tiers,
      priorities
    };
  }

  /**
   * Categorizes a numeric score into a recognized pedagogical mastery tier.
   * @param {number} score - Score from 0 to 100
   * @returns {{ tier: string, label: string, color: string, badgeClass: string }}
   */
  classifyTier(score) {
    const val = Number(score) || 0;
    if (val >= 85) {
      return {
        tier: 'MASTERY',
        label: 'Benchmark Mastery',
        color: 'text-emerald-600 dark:text-emerald-400',
        badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
      };
    }
    if (val >= 70) {
      return {
        tier: 'COMPETENT',
        label: 'Interview Ready',
        color: 'text-blue-600 dark:text-blue-400',
        badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
      };
    }
    if (val >= 50) {
      return {
        tier: 'DEVELOPING',
        label: 'Developing Practice',
        color: 'text-amber-600 dark:text-amber-400',
        badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
      };
    }
    return {
      tier: 'NOVICE',
      label: 'Foundational Gap',
      color: 'text-red-600 dark:text-red-400',
      badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
    };
  }

  /**
   * Calculates deliberate study hours required to bridge gaps, ranked by ROI.
   * @param {number[]} skillGaps - Array of numeric gaps
   * @param {number[]} weights   - Normalized weights
   * @returns {Array<{ skill: string, gap: number, estimatedHours: number, priority: string, priorityScore: number }>}
   */
  calculateStudyEffort(skillGaps = [], weights = [0.25, 0.25, 0.25, 0.25]) {
    return skillGaps.map((gap, i) => {
      const label = SKILL_LABELS[i] || `Skill ${i + 1}`;
      const weight = weights[i] || 0.25;

      // Rule of thumb: ~5 points of skill gap requires ~2.5 hours of deliberate practice
      const estimatedHours = gap > 0 ? Math.max(1, Math.round((gap / 5) * 2.5)) : 0;
      const priorityScore = parseFloat((gap * weight).toFixed(2));

      let priority = 'MAINTAIN';
      if (gap > 0) {
        if (priorityScore >= 8) priority = 'CRITICAL';
        else if (priorityScore >= 4) priority = 'HIGH';
        else priority = 'MODERATE';
      }

      return {
        skill: label,
        gap,
        estimatedHours,
        priority,
        priorityScore
      };
    }).sort((a, b) => b.priorityScore - a.priorityScore);
  }

  /**
   * Benchmarks student skills simultaneously across all target companies.
   * Provides immediate comparative placement fit probability.
   *
   * @param {number[]} studentSkills - Current candidate skill scores
   * @param {Object} [companyBenchmarks=DEFAULT_COMPANY_BENCHMARKS]
   * @returns {Array<{ company: string, readinessScore: number, weightedScore: number, matchStatus: string, description: string, primaryGap: string }>}
   */
  calculateCompanyFits(studentSkills = [], companyBenchmarks = DEFAULT_COMPANY_BENCHMARKS) {
    const results = [];

    for (const [company, config] of Object.entries(companyBenchmarks)) {
      const { readinessScore, weightedScore, skillGaps } = this.calculateGaps(studentSkills, config.targets, config.weights);
      
      // Find largest gap
      let maxGapIdx = 0;
      let maxGapVal = 0;
      skillGaps.forEach((g, idx) => {
        if (g > maxGapVal) {
          maxGapVal = g;
          maxGapIdx = idx;
        }
      });

      let matchStatus = 'Extensive Preparation Required';
      if (weightedScore >= 85) matchStatus = 'High Offer Likelihood';
      else if (weightedScore >= 70) matchStatus = 'Interview Qualified';
      else if (weightedScore >= 55) matchStatus = 'Within Reach (1-Week Sprint)';

      results.push({
        company,
        readinessScore,
        weightedScore,
        matchStatus,
        description: config.desc,
        primaryGap: maxGapVal > 0 ? `${SKILL_LABELS[maxGapIdx]} (-${maxGapVal} pts)` : 'None (Fully Qualified)'
      });
    }

    return results.sort((a, b) => b.weightedScore - a.weightedScore);
  }

  /**
   * Analyzes candidate learning velocity and predicts expected attempts or days to reach target readiness.
   * @param {number[]} scoreHistory - Chronological array of overall readiness scores (e.g. [62, 68, 75])
   * @param {number} [targetReadiness=85] - Benchmark readiness score to achieve
   * @returns {{ delta: number, velocityPerAttempt: number, trend: string, attemptsToTarget: number }}
   */
  calculateVelocity(scoreHistory = [], targetReadiness = 85) {
    if (!Array.isArray(scoreHistory) || scoreHistory.length < 2) {
      return {
        delta: 0,
        velocityPerAttempt: 0,
        trend: 'INSUFFICIENT_DATA',
        attemptsToTarget: 0
      };
    }

    const n = scoreHistory.length;
    const initial = Number(scoreHistory[0]) || 0;
    const current = Number(scoreHistory[n - 1]) || 0;
    const delta = current - initial;

    // Average change per attempt
    const velocityPerAttempt = parseFloat((delta / (n - 1)).toFixed(2));

    let trend = 'STEADY';
    if (velocityPerAttempt > 3.0) trend = 'ACCELERATING';
    else if (velocityPerAttempt < -0.5) trend = 'REGRESSING';
    else if (velocityPerAttempt <= 0.5) trend = 'PLATEAU';

    // Attempts needed to reach target readiness
    const pointsNeeded = Math.max(0, targetReadiness - current);
    let attemptsToTarget = 0;

    if (pointsNeeded === 0) {
      attemptsToTarget = 0;
    } else if (velocityPerAttempt > 0) {
      attemptsToTarget = Math.ceil(pointsNeeded / velocityPerAttempt);
    } else {
      attemptsToTarget = Infinity; // Will not reach without intervention
    }

    return {
      delta,
      velocityPerAttempt,
      trend,
      attemptsToTarget: isFinite(attemptsToTarget) ? attemptsToTarget : 'Intervention Needed'
    };
  }
}
