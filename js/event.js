// event.js — handle event info and event gallery
import { load, save } from './storage.js';
export const EVENT_INFO_KEY = 'eventInfo';
export const EVENT_GALLERY_KEY = 'eventGallery';

export let eventInfo = load(EVENT_INFO_KEY, { name:'', date:'', loc:'', desc:'' });
export let eventGallery = load(EVENT_GALLERY_KEY, []);

export function saveEventInfo() {
  save(EVENT_INFO_KEY, eventInfo);
}

export function addEventImage(dataUrl) {
  if (!dataUrl) return;
  eventGallery.push(dataUrl);
  save(EVENT_GALLERY_KEY, eventGallery);
}

export function removeEventImageAt(index) {
  if (index < 0 || index >= eventGallery.length) return false;
  eventGallery.splice(index,1);
  save(EVENT_GALLERY_KEY, eventGallery);
  return true;
}
