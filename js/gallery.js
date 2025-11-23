// gallery.js — manage artworks array and persistence
import { load, save } from './storage.js';

export const GALLERY_KEY = 'gallery';
export const NEXT_ID_KEY = 'nextArtId';

export let artworks = load(GALLERY_KEY, []);
export let nextArtId = Number(localStorage.getItem(NEXT_ID_KEY) || 1);

export function saveArtworks() {
  save(GALLERY_KEY, artworks);
  localStorage.setItem(NEXT_ID_KEY, String(nextArtId));
}

export function addArtwork(obj) {
  const art = {
    id: nextArtId++,
    title: obj.title || 'Untitled',
    desc: obj.desc || '',
    img: obj.img || ''
  };
  artworks.push(art);
  saveArtworks();
  return art;
}

export function updateArtwork(id, patch) {
  const i = artworks.findIndex(a => a.id === id);
  if (i === -1) return null;
  artworks[i] = { ...artworks[i], ...patch };
  saveArtworks();
  return artworks[i];
}

export function removeArtworkById(id) {
  const i = artworks.findIndex(a => a.id === id);
  if (i === -1) return false;
  artworks.splice(i,1);
  saveArtworks();
  return true;
}

export function loadArtworksFromStorage() {
  artworks = load(GALLERY_KEY, []);
  nextArtId = Number(localStorage.getItem(NEXT_ID_KEY) || 1);
}
