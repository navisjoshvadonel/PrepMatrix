/**
 * onboardingController.js — Onboarding Slider & Company Select
 * Wires the self-assessment sliders and company dropdown.
 * On completion, launches the assessment engine.
 */

import { setState, AppState } from '../state.js';
import { navigateTo } from '../router.js';
import { startAssessment } from '../assessment.js';
import { sound } from '../utils/soundEngine.js';

/* ── DOM refs ───────────────────────────────────────────────── */
const $ = id => document.getElementById(id);

const sliders = [
  { slider: $('slider-logic'), val: $('val-logic') },
  { slider: $('slider-ds'),    val: $('val-ds')    },
  { slider: $('slider-algo'),  val: $('val-algo')  },
  { slider: $('slider-sys'),   val: $('val-sys')   },
];

const selectCompany     = $('select-company');
const btnCompleteOnboard = $('btn-complete-onboard');

/* ── Slider labels ───────────────────────────────────────────── */
sliders.forEach(({ slider, val }) => {
  slider?.addEventListener('input', e => {
    if (val) val.textContent = `${e.target.value}%`;
  });
});

/* ── Company select → enable button ─────────────────────────── */
selectCompany?.addEventListener('change', () => {
  if (selectCompany.value) {
    if (btnCompleteOnboard) btnCompleteOnboard.disabled = false;
  }
});

/* ── Complete onboarding → go to assessment ──────────────────── */
btnCompleteOnboard?.addEventListener('click', () => {
  const company = selectCompany?.value;
  if (!company) return;

  setState({ company });
  sound.playClick();

  navigateTo('assessment');
  startAssessment(company);
});
