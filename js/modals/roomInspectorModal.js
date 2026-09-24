/**
 * roomInspectorModal.js — Room Controller & Carbon Inspector (SDG 11)
 * Controls modal-room-inspector: inspection of lab rooms and hibernation toggling.
 */

import { AppState, setState } from '../state.js';
import { openModal, closeModal } from './modalManager.js';
import { updateSDG11 } from '../controllers/dashboardController.js';
import { sound } from '../utils/soundEngine.js';

const $ = id => document.getElementById(id);

let _roomController = null;
let _selectedRoomId = 1;

/**
 * Open the room inspector modal for a given room.
 * @param {number|string} roomId
 * @param {import('../engines/RoomController.js').RoomController} [controllerInstance]
 */
export function openRoomInspector(roomId, controllerInstance = null) {
  _selectedRoomId = Number(roomId);
  setState({ selectedRoomId: _selectedRoomId });

  if (controllerInstance) {
    _roomController = controllerInstance;
  }

  const room = _roomController?.rooms?.find(r => r.id === _selectedRoomId);
  if (!room) return;

  const nameEl    = $('inspector-room-name');
  const floorEl   = $('inspector-room-floor');
  const badgeEl   = $('inspector-status-badge');
  const occEl     = $('inspector-occupancy');
  const powerEl   = $('inspector-power');
  const tempEl    = $('inspector-temp');
  const aqiEl     = $('inspector-aqi');

  if (nameEl)  nameEl.textContent  = room.name;
  if (floorEl) floorEl.textContent = room.floor;
  if (badgeEl) {
    badgeEl.textContent = room.status === 'active' ? 'Active Occupancy' : 'Hibernating (Standby)';
    badgeEl.className = `font-bold text-sm mt-0.5 ${room.status === 'active' ? 'text-emerald-500' : 'text-slate-400'}`;
  }
  if (occEl)   occEl.textContent   = `${room.occupants} / ${room.capacity} Candidates`;
  if (powerEl) powerEl.textContent = `${room.hvacPowerKW} kW`;
  if (tempEl)  tempEl.textContent  = `${room.tempCelsius}°C`;
  if (aqiEl)   aqiEl.textContent   = room.airQuality;

  openModal('modal-room-inspector');
  sound.playClick?.();
}

/* ── Close listener ──────────────────────────────────────────── */
$('btn-close-inspector')?.addEventListener('click', () => {
  closeModal('modal-room-inspector');
  sound.playClick?.();
});

/* ── Toggle hibernation listener ─────────────────────────────── */
$('btn-toggle-room-state')?.addEventListener('click', () => {
  if (!_roomController) return;
  const updatedRoom = _roomController.toggleRoom(_selectedRoomId);
  if (updatedRoom) {
    sound.playClick?.();
    openRoomInspector(_selectedRoomId, _roomController);
    if (typeof updateSDG11 === 'function') {
      updateSDG11();
    }
  }
});
