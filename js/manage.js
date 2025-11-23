// manage.js — render/manage artworks UI (uses gallery module)
import { qs, escapeHtml, placeholderImage } from './utils.js';
import * as gallery from './gallery.js';

export function renderManageList() {
  const list = qs('manageList');
  if (!list) return;
  list.innerHTML = '';
  if (!gallery.artworks.length) {
    list.innerHTML = '<div class="muted">No artworks yet.</div>';
    return;
  }
  gallery.artworks.forEach((art, i) => {
    const row = document.createElement('div'); row.className = 'manage-item';
    const img = document.createElement('img'); img.src = art.img || placeholderImage(); row.appendChild(img);
    const info = document.createElement('div'); info.style.flex = '1';
    const t = document.createElement('div'); t.style.fontWeight = '700'; t.textContent = art.title || 'Untitled';
    const d = document.createElement('div'); d.className = 'muted'; d.textContent = art.desc || '';
    info.appendChild(t); info.appendChild(d);
    const actions = document.createElement('div'); actions.style.display='flex'; actions.style.flexDirection='column'; actions.style.gap='8px';
    const editBtn = document.createElement('button'); editBtn.className='small-btn'; editBtn.textContent='Edit'; editBtn.onclick = () => window.startEditArtwork(i);
    const delBtn = document.createElement('button'); delBtn.className='small-btn'; delBtn.textContent='Delete'; delBtn.onclick = () => {
      if (!confirm('Delete this artwork?')) return;
      gallery.removeArtworkById(art.id);
      renderManageList();
    };
    actions.appendChild(editBtn); actions.appendChild(delBtn);
    row.appendChild(info); row.appendChild(actions);
    list.appendChild(row);
  });
}
