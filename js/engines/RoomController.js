/**
 * RoomController.js
 * Manages campus digital twin room states, smart HVAC hibernation, and carbon offset tracking.
 * Aligned with SDG 11 (Sustainable Cities and Communities) & SDG 12 (Responsible Consumption).
 */

export class RoomController {
  constructor(totalRooms = 10) {
    this.totalRooms = totalRooms;
    this.rooms = [];
    this.kwhPerRoom = 2.5;
    this.co2KgPerKWh = 0.82; // Indian / global grid avg emissions factor kg CO2 / kWh
    this.costPerKWh = 8.5; // Currency units (e.g. INR / cents)
    this.initRooms();
  }

  initRooms() {
    this.rooms = [];
    for (let i = 1; i <= this.totalRooms; i++) {
      // First 5 active by default, rest hibernating
      const isHibernating = i > 5;
      this.rooms.push({
        id: i,
        name: `Lab ${i < 10 ? '0' + i : i}`,
        floor: i <= 5 ? 'Ground Floor' : '1st Floor',
        status: isHibernating ? 'hibernating' : 'active',
        occupants: isHibernating ? 0 : Math.floor(Math.random() * 4) + 2,
        capacity: 6,
        tempCelsius: isHibernating ? 28 : 22,
        hvacPowerKW: isHibernating ? 0.2 : 2.5,
        lighting: isHibernating ? '10% (Standby)' : '100% (Daylight LED)',
        airQuality: isHibernating ? 'Good (42 AQI)' : 'Optimal (35 AQI)'
      });
    }
  }

  toggleRoom(roomId) {
    const room = this.rooms.find(r => r.id === Number(roomId));
    if (!room) return null;

    if (room.status === 'hibernating') {
      room.status = 'active';
      room.occupants = 4;
      room.tempCelsius = 22;
      room.hvacPowerKW = 2.5;
      room.lighting = '100% (Daylight LED)';
    } else {
      room.status = 'hibernating';
      room.occupants = 0;
      room.tempCelsius = 28;
      room.hvacPowerKW = 0.2;
      room.lighting = '10% (Standby)';
    }
    return room;
  }

  getMetrics() {
    const activeRooms = this.rooms.filter(r => r.status === 'active');
    const hibernatingRooms = this.rooms.filter(r => r.status === 'hibernating');

    // Energy saved calculation based on hibernated rooms
    const hoursInSession = 4;
    const energySavedKWh = hibernatingRooms.length * (this.kwhPerRoom - 0.2) * hoursInSession;
    const co2AvoidedKg = (energySavedKWh * this.co2KgPerKWh).toFixed(1);
    const costSaved = Math.round(energySavedKWh * this.costPerKWh);

    return {
      total: this.totalRooms,
      activeCount: activeRooms.length,
      hibernatingCount: hibernatingRooms.length,
      energySavedKWh: energySavedKWh.toFixed(1),
      co2AvoidedKg,
      costSaved,
      rooms: this.rooms
    };
  }
}
