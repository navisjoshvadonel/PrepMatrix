/**
 * mockData.js — Simulated Student Population Generator
 * Produces a realistic cohort of 120 students for Admin Dashboard analytics.
 */

const COMPANY_TARGETS = {
  'Zoho':    [90, 80, 85, 80],
  'Zapro':   [80, 90, 75, 85],
  'TCS':     [70, 70, 70, 70],
  'Infosys': [65, 75, 65, 60],
  'Wipro':   [68, 72, 68, 65],
};

const DEPARTMENTS = ['CSE', 'IT', 'ECE', 'MCA', 'AIDS'];
const COMPANIES = Object.keys(COMPANY_TARGETS);
const NAMES = [
  'Arjun', 'Priya', 'Karthik', 'Divya', 'Ravi', 'Meena', 'Suresh', 'Anitha',
  'Vignesh', 'Kavitha', 'Dinesh', 'Ramya', 'Sathish', 'Nithya', 'Ganesh',
  'Asha', 'Kumar', 'Lakshmi', 'Manoj', 'Rekha', 'Senthil', 'Uma', 'Vijay',
  'Geetha', 'Balaji', 'Padma', 'Mani', 'Selvi', 'Prakash', 'Hema'
];

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max, decimals = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generateStudentSkills(profile) {
  // profile: 'high' | 'mid' | 'low' | 'burnt'
  switch (profile) {
    case 'high':  return [rand(75,100), rand(70,100), rand(72,100), rand(68,100)];
    case 'mid':   return [rand(45,74),  rand(45,74),  rand(40,74),  rand(35,70)];
    case 'low':   return [rand(10,44),  rand(10,44),  rand(10,44),  rand(10,44)];
    case 'burnt': return [rand(55,85),  rand(50,80),  rand(40,75),  rand(35,70)];
    default:      return [rand(30,90),  rand(30,90),  rand(30,90),  rand(30,90)];
  }
}

function computeReadiness(skills, target) {
  const totalGap = skills.reduce((acc, s, i) => acc + Math.max(0, target[i] - s), 0);
  const totalTarget = target.reduce((a, b) => a + b, 0);
  return totalTarget === 0 ? 100 : Math.round(((totalTarget - totalGap) / totalTarget) * 100);
}

function generateFatigueIndex(profile, continuousHours) {
  // Simulate score history based on profile
  const baseScore = profile === 'high' ? rand(70, 95)
    : profile === 'mid' ? rand(45, 69)
    : profile === 'low' ? rand(20, 44)
    : rand(30, 65); // burnt

  // Burnt-out students have high variance (declining performance)
  const variance = profile === 'burnt' ? rand(15, 30) : rand(2, 10);
  const scoreHistory = [
    Math.min(100, baseScore + rand(0, 5)),
    baseScore,
    Math.max(0, baseScore - variance / 2),
    Math.max(0, baseScore - variance),
  ];

  // Fatigue formula: variance × hours
  const avg = scoreHistory.reduce((a, b) => a + b, 0) / 4;
  const varianceCalc = scoreHistory.reduce((acc, s) => acc + Math.pow(s - avg, 2), 0) / 4;
  return parseFloat((Math.sqrt(varianceCalc) * continuousHours).toFixed(1));
}

export function generateStudentCohort(count = 120) {
  const students = [];
  const profileWeights = ['high', 'high', 'mid', 'mid', 'mid', 'low', 'burnt'];

  for (let i = 0; i < count; i++) {
    const name = NAMES[i % NAMES.length] + ' ' + String.fromCharCode(65 + (i % 26));
    const dept = DEPARTMENTS[i % DEPARTMENTS.length];
    const company = COMPANIES[Math.floor(Math.random() * COMPANIES.length)];
    const profile = profileWeights[Math.floor(Math.random() * profileWeights.length)];
    const continuousHours = profile === 'burnt' ? rand(6, 10) : rand(1, 5);

    const skills = generateStudentSkills(profile);
    const target = COMPANY_TARGETS[company];
    const readiness = computeReadiness(skills, target);
    const fatigueIndex = generateFatigueIndex(profile, continuousHours);
    const isAtRisk = fatigueIndex >= 100;
    const isActive = Math.random() > 0.25; // 75% currently online

    students.push({
      id: i + 1,
      name,
      dept,
      targetCompany: company,
      skills,
      readiness,
      fatigueIndex,
      continuousHours,
      isAtRisk,
      isActive,
      profile,
    });
  }

  return students;
}

export function getAdminStats(students) {
  const total = students.length;
  const active = students.filter(s => s.isActive).length;
  const atRisk = students.filter(s => s.isAtRisk).length;
  const avgReadiness = Math.round(students.reduce((a, s) => a + s.readiness, 0) / total);
  const avgFatigue = parseFloat((students.reduce((a, s) => a + s.fatigueIndex, 0) / total).toFixed(1));

  // Department breakdown
  const byDept = {};
  students.forEach(s => {
    if (!byDept[s.dept]) byDept[s.dept] = { total: 0, atRisk: 0, avgReadiness: 0 };
    byDept[s.dept].total++;
    if (s.isAtRisk) byDept[s.dept].atRisk++;
    byDept[s.dept].avgReadiness += s.readiness;
  });
  Object.keys(byDept).forEach(d => {
    byDept[d].avgReadiness = Math.round(byDept[d].avgReadiness / byDept[d].total);
  });

  // Company breakdown
  const byCompany = {};
  students.forEach(s => {
    if (!byCompany[s.targetCompany]) byCompany[s.targetCompany] = { total: 0, avgReadiness: 0 };
    byCompany[s.targetCompany].total++;
    byCompany[s.targetCompany].avgReadiness += s.readiness;
  });
  Object.keys(byCompany).forEach(c => {
    byCompany[c].avgReadiness = Math.round(byCompany[c].avgReadiness / byCompany[c].total);
  });

  // Campus rooms (SDG 11) — active students need seating
  const CAPACITY_PER_ROOM = 12;
  const TOTAL_ROOMS = 20;
  const KWH_PER_ROOM = 2.5;
  const roomsNeeded = Math.ceil(active / CAPACITY_PER_ROOM);
  const activeRooms = Math.min(roomsNeeded, TOTAL_ROOMS);
  const hibernatingRooms = TOTAL_ROOMS - activeRooms;
  const energySaved = parseFloat((hibernatingRooms * KWH_PER_ROOM).toFixed(1));
  const spillover = Math.max(0, active - (TOTAL_ROOMS * CAPACITY_PER_ROOM));

  return {
    total,
    active,
    atRisk,
    avgReadiness,
    avgFatigue,
    byDept,
    byCompany,
    campus: { activeRooms, hibernatingRooms, TOTAL_ROOMS, energySaved, spillover },
    atRiskStudents: students.filter(s => s.isAtRisk).slice(0, 8), // show top 8
  };
}
