/**
 * WellnessEngine.js
 * Drives the Cognitive Rejuvenation Center, guided 4-7-8 mindful breathing bio-break,
 * and cognitive fatigue index de-escalation.
 * Aligned with SDG 3 (Good Health and Well-being).
 */

import { sound } from '../utils/soundEngine.js';

export class WellnessEngine {
  constructor() {
    this.isActive = false;
    this.timer = null;
    this.secondsRemaining = 45;
    this.totalDuration = 45;
    this.breathPhase = 'inhale'; // 'inhale' (4s), 'hold' (7s), 'exhale' (8s)
    this.phaseTime = 0;
  }

  startSession(onTick, onPhaseChange, onComplete) {
    this.isActive = true;
    this.secondsRemaining = this.totalDuration;
    sound.playChime();

    let cycleSec = 0;

    this.timer = setInterval(() => {
      this.secondsRemaining--;
      cycleSec = (cycleSec + 1) % 19; // 4 + 7 + 8 = 19 second cycle

      if (cycleSec < 4) {
        this.breathPhase = 'inhale';
      } else if (cycleSec < 11) {
        this.breathPhase = 'hold';
      } else {
        this.breathPhase = 'exhale';
      }

      if (onPhaseChange) onPhaseChange(this.breathPhase, cycleSec);
      if (onTick) onTick(this.secondsRemaining, this.totalDuration);

      if (this.secondsRemaining <= 0) {
        this.stopSession();
        sound.playCelebration();
        if (onComplete) onComplete();
      }
    }, 1000);
  }

  stopSession() {
    this.isActive = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
