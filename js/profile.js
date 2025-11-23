// profile.js — load / save artist profile and avatar handling
import { load, save } from './storage.js';

export const PROFILE_KEY = 'artistProfile';

export let profileData = load(PROFILE_KEY, {
  name: 'RAVYN',
  bio: 'I love my wife.',
  age: '',
  country: '',
  avatar: ''
});

// Save current in-memory profileData to storage
export function saveProfile() {
  save(PROFILE_KEY, profileData);
}

// Replace in-memory data and persist
export function setProfile(updates) {
  profileData = { ...profileData, ...updates };
  saveProfile();
}

// Read file input (avatar) and set profileData.avatar (expects File)
export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const r = new FileReader();
    r.onload = e => resolve(e.target.result);
    r.onerror = e => reject(e);
    r.readAsDataURL(file);
  });
}

// helper to add avatar from a File object and persist
export async function setAvatarFile(file) {
  if (!file) return;
  const dataUrl = await readFileAsDataURL(file);
  profileData.avatar = dataUrl;
  saveProfile();
}
