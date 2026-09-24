/**
 * StressSentinel — SDG 3: Good Health & Well-Being
 * 
 * Clinical cognitive fatigue and burnout prevention engine:
 *  1. Strictly-negative performance degradation accumulator
 *  2. Exponential decay cognitive rest and recovery modeling
 *  3. Cognitive state classification (Optimal Focus → Mandatory Lockout)
 *  4. Recommended rest prescription calculator
 */
export class StressSentinel {
  constructor(lockoutThreshold = 100, recoveryDecayRate = 0.045) {
    this.lockoutThreshold = lockoutThreshold;
    this.decayRate = recoveryDecayRate; // Lambda factor for exponential recovery per minute
  }

  /**
   * Analyzes score history and continuous study duration to evaluate cognitive load.
   * 
   * @param {number[]} scoreHistory    - Chronological array of mock-interview scores
   * @param {number}   continuousHours - Hours studied/practiced without an active break
   * @param {number}   [restMinutes=0] - Dedicated mindfulness / break minutes taken
   * @returns {{
   *   lockoutRequired: boolean,
   *   fatigueIndex: number,
   *   rawIndex: number,
   *   cognitiveState: string,
   *   stateColor: string,
   *   recommendedRestMinutes: number
   * }}
   */
  analyzeFatigue(scoreHistory = [], continuousHours = 0, restMinutes = 0) {
    // Guard: invalid or insufficient data
    if (
      !Array.isArray(scoreHistory) ||
      scoreHistory.length < 2
    ) {
      return {
        lockoutRequired: false,
        fatigueIndex: 0,
        rawIndex: 0,
        cognitiveState: 'OPTIMAL_FOCUS',
        stateColor: 'text-emerald-500',
        recommendedRestMinutes: 0
      };
    }

    const hours = Math.max(0, Number(continuousHours) || 0);

    // No time elapsed → no fatigue can accumulate
    if (hours === 0) {
      return {
        lockoutRequired: false,
        fatigueIndex: 0,
        rawIndex: 0,
        cognitiveState: 'OPTIMAL_FOCUS',
        stateColor: 'text-emerald-500',
        recommendedRestMinutes: 0
      };
    }

    let totalDrop = 0;

    for (let i = 1; i < scoreHistory.length; i++) {
      const prev = Number(scoreHistory[i - 1]) || 0;
      const curr = Number(scoreHistory[i])     || 0;

      // ONLY accumulate drops; improvements are ignored
      if (curr < prev) {
        totalDrop += prev - curr;
      }
    }

    // Raw fatigue index = total drop points * continuous study hours
    const rawIndex = parseFloat((totalDrop * hours).toFixed(2));

    // Apply exponential decay recovery if rest minutes were logged:
    // F_rest = F_raw * e^(-lambda * minutes)
    const rest = Math.max(0, Number(restMinutes) || 0);
    const recoveredIndex = rest > 0
      ? parseFloat((rawIndex * Math.exp(-this.decayRate * rest)).toFixed(2))
      : rawIndex;

    const fatigueIndex = Math.max(0, recoveredIndex);

    // Strict inequality: > 100 triggers lockout
    const lockoutRequired = fatigueIndex > this.lockoutThreshold;

    // Cognitive State Classification
    let cognitiveState = 'OPTIMAL_FOCUS';
    let stateColor = 'text-emerald-500';

    if (fatigueIndex > this.lockoutThreshold) {
      cognitiveState = 'COGNITIVE_LOCKOUT';
      stateColor = 'text-red-500';
    } else if (fatigueIndex >= 70) {
      cognitiveState = 'ACUTE_FATIGUE';
      stateColor = 'text-amber-500';
    } else if (fatigueIndex >= 35) {
      cognitiveState = 'MILD_STRAIN';
      stateColor = 'text-yellow-500';
    }

    // Calculate recommended rest time needed to return to baseline (< 40)
    let recommendedRestMinutes = 0;
    if (fatigueIndex > 40) {
      // 40 = F * e^(-lambda * t) => t = -ln(40 / F) / lambda
      recommendedRestMinutes = Math.max(5, Math.ceil(-Math.log(40 / fatigueIndex) / this.decayRate));
    }

    return {
      lockoutRequired,
      fatigueIndex,
      rawIndex,
      cognitiveState,
      stateColor,
      recommendedRestMinutes
    };
  }

  /**
   * Models the recovery decay of a given fatigue index after taking a break.
   * @param {number} currentFatigue 
   * @param {number} breakMinutes 
   * @returns {number} New fatigue index
   */
  registerRest(currentFatigue, breakMinutes) {
    const f = Math.max(0, Number(currentFatigue) || 0);
    const m = Math.max(0, Number(breakMinutes) || 0);
    if (f === 0 || m === 0) return f;
    return parseFloat((f * Math.exp(-this.decayRate * m)).toFixed(2));
  }
}
