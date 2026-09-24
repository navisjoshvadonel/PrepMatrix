# PrepMatrix Command ⚡

> **Sustainable Interview Preparation Command Centre Powered by UN SDG-Aligned Optimization Engines.**

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![SDG 4: Quality Education](https://img.shields.io/badge/SDG%204-Quality%20Education-c5192d.svg)](https://sdgs.un.org/goals/goal4)
[![SDG 11: Sustainable Cities](https://img.shields.io/badge/SDG%2011-Sustainable%20Cities-fd9d24.svg)](https://sdgs.un.org/goals/goal11)
[![SDG 3: Good Health](https://img.shields.io/badge/SDG%203-Good%20Health%20%26%20Well--being-4c9f38.svg)](https://sdgs.un.org/goals/goal3)
[![SDG 8: Decent Work](https://img.shields.io/badge/SDG%208-Decent%20Work-a21942.svg)](https://sdgs.un.org/goals/goal8)
[![Built with Pure JS & Tailwind](https://img.shields.io/badge/Stack-Vanilla%20JS%20%7C%20Tailwind%20CSS-10b981.svg)](#technology-stack)

---

## 🌟 Overview

**PrepMatrix** is an enterprise-grade Single-Page Application (SPA) designed to bridge the critical gap between **student placement readiness** and **institutional energy sustainability**.

Unlike standard assessment platforms, PrepMatrix couples high-stakes mock interview preparation with pure-logic algorithms that safeguard candidate cognitive health and minimize institutional carbon footprints.

---

## 🏛️ Core Engines & SDG Alignment

```
                               ┌────────────────────────────────┐
                               │       PrepMatrix Platform      │
                               └────────────────┬───────────────┘
                                                │
         ┌──────────────────────────────┼──────────────────────────────┐
         ▼                              ▼                              ▼
  ┌───────────────┐              ┌───────────────┐              ┌───────────────┐
  │     SDG 4     │              │     SDG 11    │              │     SDG 3     │
  │ Skill Matrix  │              │Resource Router│              │Stress Sentinel│
  │    Engine     │              │  & Twin IoT   │              │   & Bio-Break │
  └───────────────┘              └───────────────┘              └───────────────┘
```

### 1. 🎯 SDG 4: Quality Education — `SkillMatrixEngine.js`
- **Weighted Gap Analysis**: Evaluates candidate competencies across 4 core domains (*Core Logic, Data Structures, Algorithms, System Design*) using normalized company-specific importance factors (e.g. Zoho prioritizes Core Logic at 45%, while Google prioritizes Hard Algorithms at 40%).
- **Pedagogical Mastery Tiering**: Categorizes scores into `NOVICE`, `DEVELOPING`, `COMPETENT`, and `MASTERY`.
- **Deliberate Study Effort Estimator**: Calculates exact hours of practice needed to close each gap (`~5 pts gap ≈ 2.5h practice`).
- **Multi-Company Fit Probability**: Compares candidate skills across *Google, Amazon, Microsoft, Zoho, Zapro, and TCS* simultaneously to output offer probabilities.
- **Learning Velocity**: Computes trajectory rate (`%/session`) and projects expected attempts to reach 85%+ readiness.

### 2. 🏢 SDG 11: Sustainable Cities & Communities — `ResourceRouter.js` & `RoomController.js`
- **Greedy Room Compaction**: Automatically consolidates concurrent candidate mock interviews into the minimum physical classrooms to avoid heating, ventilation, and lighting waste.
- **Dynamic Energy & CO₂ Ledger**: Accounts for regional emissions factors (`0.82 kg CO₂/kWh`) and calculates cost savings in real-time.
- **Campus Digital Twin**: Interactive Room Inspector allowing administrators and candidates to inspect room temperatures, occupancy, and toggle standby hibernation modes.

### 3. 🧠 SDG 3: Good Health & Well-Being — `StressSentinel.js` & `WellnessEngine.js`
- **Cognitive Degradation Detection**: Computes strictly-negative performance variance over time to identify candidate burnout before catastrophic test failure.
- **Safety Lockout Protocol**: Triggers a system lockout when the cognitive fatigue index breaches 100.
- **4-7-8 Mindful Bio-Break**: An interactive animated breathing visualizer (*Inhale 4s → Hold 7s → Exhale 8s*) backed by an exponential recovery model ($F = F_0 \cdot e^{-\lambda t}$) that reduces fatigue by 25–30 points and safely lifts lockouts.

---

## 🚀 Key Platform Features

### 💻 PrepLab Live IDE Sandbox (`CodeRunnerEngine.js`)
- Full in-browser JavaScript compiler & execution sandbox.
- Automated evaluation against unit test suites with sub-millisecond execution benchmarks.
- Preloaded placement challenges including *Two Sum Optimal (Hash Map O(n))*, *Reverse Array In-Place (Two Pointers)*, and *Valid Parentheses (Stack)*.

### 🎮 Gamified Assessment Engine (`assessment.js`)
- **4 Real-World Rounds**: Aptitude, Technical MCQ, HR Behavioral (STAR method), and Live Coding.
- **Gamified Elements**: Real-time XP tracking, combo streaks with dynamic banners, SVG circular countdown timers, and S/A/B/C/D grading.

### 📅 Personalized 7-Day Sprint Action Plan (`RoadmapEngine.js`)
- Dynamically schedules a 7-day preparation sprint targeting the candidate's two weakest detected skill gaps.
- Daily checklists with study hour estimates and progress tracking.

### 🎵 Procedural Web Audio Engine (`soundEngine.js`)
- Zero external audio files or dependencies.
- Synthesizes harmonic waveforms via native `AudioContext` for tactile clicks, correct answer chimes, streak fanfares, level-up chords, and meditation bells.
- Persistent audio mute toggle in the navigation bar.

### 📜 Verified Placement Readiness Credential (`SDG 8 & SDG 4`)
- Generates official certificates with cryptographic verification tokens (`PM-2026-X89F-SDG`), competency grades, and print/PDF export styling.

### 🏢 Institution Command Centre (Admin Dashboard)
- Real-time simulation of 120+ students.
- Campus room heat map with occupancy rates.
- Department-level readiness breakdown and burnout risk alert feeds.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla JavaScript (ES6+ Modules)
- **Styling**: Tailwind CSS + Custom CSS Design Tokens (Biophilic Palette)
- **Audio**: Web Audio API (Synthesized procedural audio)
- **Visuals**: HTML5 Canvas animation (Data structures, queues, graphs)

---

## 🏁 Quick Start & Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/navisjoshvadonel/PrepMatrix.git
   cd PrepMatrix
   ```

2. **Run locally using any static server**:
   ```bash
   # Using npx serve:
   npx -y serve . -l 5173

   # Or using Python:
   python -m http.server 5173
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:5173/
   ```

---

## 👥 Credits

Designed and developed with passion by:
- **Navis Joshva Donel** & Friends

*Innovating the future of sustainable EdTech and placement engineering.*
