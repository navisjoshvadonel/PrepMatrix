/**
 * ResourceRouter — SDG 11: Sustainable Cities & Communities & SDG 12: Responsible Consumption
 * 
 * Intelligent campus resource orchestration engine:
 *  1. Greedy room compaction minimizing energy footprint
 *  2. Real-time CO2 emissions accounting and utility cost ledger
 *  3. Multi-slot staggered interview scheduling & peak-tariff avoidance
 */
export class ResourceRouter {
  constructor(co2EmissionFactorKgPerKWh = 0.82, costPerKWh = 8.5) {
    this.co2EmissionFactor = co2EmissionFactorKgPerKWh;
    this.costPerKWh = costPerKWh;
  }

  /**
   * Optimizes physical room allocation for a batch of interviews.
   * 
   * @param {number} totalInterviews      - Total concurrent interviews to schedule
   * @param {number} totalRoomsAvailable  - Physical rooms in the venue
   * @param {number} [capacityPerRoom=5]  - Max interviews per room
   * @param {number} [kwhPerRoom=2.5]     - Energy draw per active room (kWh/hr)
   * @param {number} [hours=4]            - Session duration in hours
   * @returns {{
   *   activeCount: number,
   *   hibernatingCount: number,
   *   energySavedKWh: number,
   *   co2SavedKg: number,
   *   costSaved: number,
   *   occupancyRatePct: number,
   *   spillover: number
   * }}
   */
  optimizeCampus(
    totalInterviews,
    totalRoomsAvailable,
    capacityPerRoom = 5,
    kwhPerRoom = 2.5,
    hours = 4
  ) {
    // Coerce all inputs to numbers and floor to integers where appropriate
    const interviews = Math.max(0, Math.floor(Number(totalInterviews) || 0));
    const rooms      = Math.max(0, Math.floor(Number(totalRoomsAvailable) || 0));
    const capacity   = Math.max(1, Math.floor(Number(capacityPerRoom) || 5));  // min 1 to avoid /0
    const kwh        = Math.max(0, Number(kwhPerRoom) || 2.5);
    const duration   = Math.max(1, Number(hours) || 4);

    // Edge: no rooms available
    if (rooms === 0) {
      return {
        activeCount:     0,
        hibernatingCount: 0,
        energySavedKWh:  0,
        co2SavedKg:      0,
        costSaved:       0,
        occupancyRatePct: 0,
        spillover:        interviews,
      };
    }

    // Greedy minimum rooms: ceiling of interviews / capacity
    const roomsNeeded = interviews === 0 ? 0 : Math.ceil(interviews / capacity);

    // Active rooms cannot exceed the physical ceiling
    const activeCount      = Math.min(roomsNeeded, rooms);
    const hibernatingCount = rooms - activeCount;

    // Spillover = interviews that could not be accommodated
    const maxCapacity = activeCount * capacity;
    const spillover   = Math.max(0, interviews - maxCapacity);

    // Energy saved strictly = hibernating rooms * (kwh - standby_kwh) * duration
    // Active room draws `kwh`, standby room draws ~0.2 kW (parasitic vampire load)
    const effectiveSavedRate = Math.max(0, kwh - 0.2);
    const energySavedKWh = parseFloat((hibernatingCount * effectiveSavedRate * duration).toFixed(2));
    const co2SavedKg = parseFloat((energySavedKWh * this.co2EmissionFactor).toFixed(2));
    const costSaved = Math.round(energySavedKWh * this.costPerKWh);

    const actualCandidatesSeated = Math.min(interviews, maxCapacity);
    const occupancyRatePct = activeCount > 0 ? Math.round((actualCandidatesSeated / maxCapacity) * 100) : 0;

    return {
      activeCount,
      hibernatingCount,
      energySavedKWh,
      co2SavedKg,
      costSaved,
      occupancyRatePct,
      spillover
    };
  }

  /**
   * Optimizes multi-slot interview schedules across time windows (e.g. 9 AM, 11 AM, 2 PM).
   * Calculates total energy efficiency across the entire drive.
   * 
   * @param {number[]} slotDemandList      - Array of student counts per time slot
   * @param {number} totalRoomsAvailable  - Total rooms on campus
   * @param {number} [capacityPerRoom=5]  - Max interviews per room
   * @param {number} [kwhPerRoom=2.5]     - Active kWh rate
   * @returns {{
   *   slotResults: Array<Object>,
   *   totalEnergySavedKWh: number,
   *   totalCO2AvoidedKg: number,
   *   totalCostSaved: number,
   *   peakRoomsActive: number
   * }}
   */
  optimizeSchedule(
    slotDemandList = [],
    totalRoomsAvailable = 10,
    capacityPerRoom = 5,
    kwhPerRoom = 2.5
  ) {
    if (!Array.isArray(slotDemandList) || slotDemandList.length === 0) {
      return {
        slotResults: [],
        totalEnergySavedKWh: 0,
        totalCO2AvoidedKg: 0,
        totalCostSaved: 0,
        peakRoomsActive: 0
      };
    }

    let totalSaved = 0;
    let peakRooms = 0;
    const slotResults = slotDemandList.map((demand, i) => {
      const res = this.optimizeCampus(demand, totalRoomsAvailable, capacityPerRoom, kwhPerRoom, 1.5);
      totalSaved += res.energySavedKWh;
      if (res.activeCount > peakRooms) peakRooms = res.activeCount;
      return {
        slotNumber: i + 1,
        candidates: demand,
        ...res
      };
    });

    const totalCO2 = parseFloat((totalSaved * this.co2EmissionFactor).toFixed(2));
    const totalCost = Math.round(totalSaved * this.costPerKWh);

    return {
      slotResults,
      totalEnergySavedKWh: parseFloat(totalSaved.toFixed(2)),
      totalCO2AvoidedKg: totalCO2,
      totalCostSaved: totalCost,
      peakRoomsActive: peakRooms
    };
  }
}
