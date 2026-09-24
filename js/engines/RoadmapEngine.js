/**
 * RoadmapEngine.js
 * Generates an adaptive 7-Day Sprint Action Plan tailored to the student's detected skill gaps.
 * Aligned with SDG 4 (Quality Education) for equitable, goal-driven interview mastery.
 */

export class RoadmapEngine {
  generateSprint(skillScores, targetCompany = 'TCS') {
    // skillScores: [Core Logic, Data Structures, Algorithms, System Design]
    const skills = ['Core Logic', 'Data Structures', 'Algorithms', 'System Design'];
    const gaps = skillScores.map((score, i) => ({
      skill: skills[i],
      score,
      gap: 100 - score
    })).sort((a, b) => b.gap - a.gap);

    const primaryWeakness = gaps[0].skill;
    const secondaryWeakness = gaps[1].skill;

    return [
      {
        day: 1,
        title: `Diagnostic & Foundations: ${primaryWeakness}`,
        hours: '2.5 hrs',
        tag: 'HIGH PRIORITY',
        tagColor: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
        tasks: [
          `Review asymptotic complexity (Big-O time and space trade-offs).`,
          `Implement 3 core foundational drills in ${primaryWeakness}.`,
          `Complete PrepMatrix practice checkpoint for ${targetCompany} standards.`
        ]
      },
      {
        day: 2,
        title: `Deep-Dive Problem Solving: ${primaryWeakness}`,
        hours: '3.0 hrs',
        tag: 'CORE ENGINE',
        tagColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        tasks: [
          `Solve 2 medium-tier challenges on LeetCode/PrepLab.`,
          `Analyze memory bottlenecks & recursion stack limits.`,
          `Log time spent per problem to monitor cognitive pacing.`
        ]
      },
      {
        day: 3,
        title: `Reinforcement: ${secondaryWeakness}`,
        hours: '2.5 hrs',
        tag: 'BALANCING',
        tagColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        tasks: [
          `Strengthen core patterns in ${secondaryWeakness} (Sliding Window / Two Pointers / Trees).`,
          `Trace edge cases: empty inputs, integer overflow, null pointers.`,
          `Verify solutions against ${targetCompany} interview pattern questions.`
        ]
      },
      {
        day: 4,
        title: `High-Level System Design & Architecture`,
        hours: '2.0 hrs',
        tag: 'SCALABILITY',
        tagColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        tasks: [
          `Architect a distributed caching layer (Redis / Memcached).`,
          `Study horizontal vs. vertical scaling and load-balancing strategies.`,
          `Draft database schema & indexing strategy for high read throughput.`
        ]
      },
      {
        day: 5,
        title: `${targetCompany} Company Mock Simulation`,
        hours: '3.0 hrs',
        tag: 'PLACEMENT SPECIFIC',
        tagColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
        tasks: [
          `Run timed 60-minute technical interview drill mimicking ${targetCompany} rounds.`,
          `Implement live code under time constraints in PrepLab sandbox.`,
          `Conduct peer review and self-debrief on runtime variance.`
        ]
      },
      {
        day: 6,
        title: `HR Behavioral Round & STAR Mastery`,
        hours: '1.5 hrs',
        tag: 'INTERPERSONAL',
        tagColor: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
        tasks: [
          `Craft 4 STAR stories (Situation, Task, Action, Result) for conflict and leadership.`,
          `Practice articulating failure recovery and cross-team collaboration.`,
          `Review PrepMatrix HR Question Bank sample model answers.`
        ]
      },
      {
        day: 7,
        title: `Endurance Simulation & Rest Protocol (SDG 3)`,
        hours: '2.0 hrs',
        tag: 'FINAL CHECK',
        tagColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        tasks: [
          `Full mock placement drive in PrepMatrix (All 4 Rounds).`,
          `Maintain Cognitive Fatigue Sentinel below index 60.`,
          `Export Verified Placement Readiness Certificate for resume.`
        ]
      }
    ];
  }
}
