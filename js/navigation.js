// navigation.js — screen show/hide controller
import { qs } from './utils.js';

export function showScreen(screenId) {
  // hide all screens
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  // hide viewer overlay if present
  const overlay = qs('viewerOverlay');
  if (overlay) overlay.classList.add('hidden');
  // show target
  const target = qs(screenId);
  if (target) target.classList.remove('hidden');
}
