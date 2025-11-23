// upload.js — helpers for upload UI (file -> dataURL)
import { qs } from './utils.js';
import { readFileAsDataURL } from './profile.js'; // reuse FileReader helper

let uploadTemp = null;

export function setupUploadUI() {
  const file = qs('artFile');
  if (!file) return;
  file.addEventListener('change', async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    uploadTemp = await readFileAsDataURL(f);
    const preview = qs('artPreview');
    if (preview) {
      preview.style.backgroundImage = `url(${uploadTemp})`;
      preview.textContent = '';
    }
  });
}

export function getUploadTemp() { return uploadTemp; }
export function clearUploadTemp() { uploadTemp = null; }
