// init.js — main wiring file that connects modules to DOM for ARTifacts_cleaned.html
import { qs, escapeHtml, placeholderImage } from './utils.js';
import { load, save } from './storage.js';
import { showScreen } from './navigation.js';
import * as profile from './profile.js';
import * as gallery from './gallery.js';
import * as upload from './upload.js';
import * as manage from './manage.js';
import * as viewer from './viewer.js';
import * as eventMod from './event.js';
import { generateQR } from './qr.js';

// small helper to safely set text content
function setText(id, txt){
  const el = qs(id); if (!el) return; el.textContent = txt;
}

function wireNavigation(){
  document.querySelectorAll('[data-screen]').forEach(btn=>{
    const screen = btn.getAttribute('data-screen');
    btn.addEventListener('click', ()=> showScreen(screen));
  });
  window.go = showScreen; // legacy inline handlers may still call go()
}

// profile UI wiring
function loadProfileUI(){
  setText('artistNameHeading', profile.profileData.name || 'Artist Name');
  setText('artistBioText', profile.profileData.bio || '');
  setText('artistAgeText', 'Age: ' + (profile.profileData.age || '—'));
  setText('artistCountryText', 'Country: ' + (profile.profileData.country || '—'));
  const av = qs('artistAvatar'); if (av) av.src = profile.profileData.avatar || '/mnt/data/artifacts logo.png';
  if (qs('artistNameInput')) qs('artistNameInput').value = profile.profileData.name || '';
  if (qs('artistBioInput')) qs('artistBioInput').value = profile.profileData.bio || '';
  if (qs('artistAgeInput')) qs('artistAgeInput').value = profile.profileData.age || '';
  if (qs('artistCountryInput')) qs('artistCountryInput').value = profile.profileData.country || '';
}

async function setupProfile(){
  const input = qs('avatarInput');
  if (input){
    input.addEventListener('change', async (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const dataUrl = await profile.readFileAsDataURL(f);
      profile.profileData.avatar = dataUrl;
      profile.saveProfile();
      loadProfileUI();
    });
  }

  qs('saveProfileBtn')?.addEventListener('click', () => {
    profile.profileData.name = qs('artistNameInput')?.value || '';
    profile.profileData.bio = qs('artistBioInput')?.value || '';
    profile.profileData.age = qs('artistAgeInput')?.value || '';
    profile.profileData.country = qs('artistCountryInput')?.value || '';
    profile.saveProfile();
    loadProfileUI();
    showScreen('artistHome');
  });
}

// gallery / upload wiring
function setupGalleryUpload(){
  // load stored artworks
  gallery.loadArtworksFromStorage();
  // upload input
  upload.setupUploadUI();
  qs('saveArtBtn')?.addEventListener('click', () => {
    const tmp = upload.getUploadTemp();
    if (!tmp) { alert('Please pick an image first'); return; }
    const title = qs('artTitle')?.value || 'Untitled';
    const desc = qs('artDesc')?.value || '';
    gallery.addArtwork({ img: tmp, title, desc });
    upload.clearUploadTemp();
    qs('artPreview').style.backgroundImage = '';
    qs('artPreview').textContent = 'Preview';
    if (qs('artTitle')) qs('artTitle').value = '';
    if (qs('artDesc')) qs('artDesc').value = '';
    renderAllGalleries();
    showScreen('artistHome');
  });

  qs('cancelArtBtn')?.addEventListener('click', () => {
    upload.clearUploadTemp();
    if (qs('artPreview')) { qs('artPreview').style.backgroundImage=''; qs('artPreview').textContent='Preview'; }
    if (qs('artTitle')) qs('artTitle').value=''; if (qs('artDesc')) qs('artDesc').value='';
    showScreen('artistHome');
  });
}

// rendering helpers
function renderArtistGrid(){
  const c = qs('artistGrid'); if (!c) return;
  c.innerHTML = '';
  if (!gallery.artworks.length) { c.innerHTML = '<div class="muted">No artworks yet — upload one.</div>'; return; }
  gallery.artworks.forEach((art, i) => {
    const d = document.createElement('div'); d.className = 'thumb';
    const img = document.createElement('img'); img.src = art.img || placeholderImage(); img.alt = art.title || 'Artwork';
    d.appendChild(img);
    const actions = document.createElement('div'); actions.className = 'actions';
    const view = document.createElement('button'); view.className = 'small-btn'; view.textContent = 'View'; view.onclick = () => openViewerAt(i);
    const edit = document.createElement('button'); edit.className = 'small-btn'; edit.textContent = 'Edit'; edit.onclick = () => startEditArtwork(i);
    const del = document.createElement('button'); del.className = 'small-btn'; del.textContent = 'Delete'; del.onclick = () => { if (confirm('Delete this artwork?')) { gallery.removeArtworkById(art.id); renderAllGalleries(); } };
    actions.appendChild(view); actions.appendChild(edit); actions.appendChild(del);
    d.appendChild(actions);
    c.appendChild(d);
  });
}

function renderPublicGallery(){
  const c = qs('publicGallery'); if (!c) return;
  c.innerHTML = '';
  if (!gallery.artworks.length) { c.innerHTML = '<div class="muted">No public artworks yet.</div>'; return; }
  gallery.artworks.forEach((art, i) => {
    const d = document.createElement('div'); d.className = 'thumb';
    const img = document.createElement('img'); img.src = art.img || placeholderImage(); img.alt = art.title || 'Artwork';
    d.appendChild(img);
    d.onclick = () => { openViewerAt(i); };
    c.appendChild(d);
  });
}

function renderManageList(){
  manage.renderManageList();
}

function renderEventHome(){
  // render event inputs and gallery
  if (qs('evtName')) qs('evtName').value = eventMod.eventInfo.name || '';
  if (qs('evtDate')) qs('evtDate').value = eventMod.eventInfo.date || '';
  if (qs('evtLoc')) qs('evtLoc').value = eventMod.eventInfo.loc || '';
  if (qs('evtDesc')) qs('evtDesc').value = eventMod.eventInfo.desc || '';
  const eg = qs('eventGallery'); if (!eg) return;
  eg.innerHTML = '';
  if (!eventMod.eventGallery.length) { eg.innerHTML = '<div class="muted">No images in event gallery</div>'; return; }
  eventMod.eventGallery.forEach((img, idx) => {
    const d = document.createElement('div'); d.className = 'thumb';
    const im = document.createElement('img'); im.src = img || placeholderImage(); d.appendChild(im);
    const del = document.createElement('button'); del.className = 'small-btn'; del.textContent='Delete'; del.style.position='absolute'; del.style.bottom='8px';
    del.onclick = () => { if (confirm('Delete this image?')) { eventMod.removeEventImageAt(idx); renderEventHome(); updateStats(); } };
    d.appendChild(del);
    eg.appendChild(d);
  });
}

// editing glue
let editingIndex = null;
function startEditArtwork(i){
  editingIndex = i;
  const art = gallery.artworks[i];
  if (!art) return;
  qs('editArtPreview').style.backgroundImage = `url(${art.img})`; qs('editArtPreview').textContent='';
  qs('editArtTitle').value = art.title || '';
  qs('editArtDesc').value = art.desc || '';
  showScreen('editArtwork');
}
function applyEdit(){
  if (editingIndex === null) return;
  const title = qs('editArtTitle')?.value || 'Untitled';
  const desc = qs('editArtDesc')?.value || '';
  const art = gallery.artworks[editingIndex];
  if (!art) return;
  gallery.updateArtwork(art.id, { title, desc });
  renderAllGalleries();
  editingIndex = null;
  showScreen('manageArtworks');
}

// viewer glue (local wrappers)
function openViewerAt(i){ viewer.openViewerAt(i); }
function closeViewer(){ viewer.closeViewer(); }
function viewerPrev(){ viewer.viewerPrev(); }
function viewerNext(){ viewer.viewerNext(); }

// event UI wiring (file input)
function setupEventUI(){
  const eventFile = qs('eventArtFile');
  if (eventFile){
    eventFile.addEventListener('change', async (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const data = await profile.readFileAsDataURL(f);
      eventMod.addEventImage(data);
      renderEventHome();
      updateStats();
    });
  }
  qs('addEventArtBtn')?.addEventListener('click', () => {
    const input = qs('eventArtFile');
    if (!input || !input.files[0]) { alert('Select a file using the input'); return; }
    profile.readFileAsDataURL(input.files[0]).then(data => { eventMod.addEventImage(data); renderEventHome(); updateStats(); input.value=''; });
  });
  qs('saveEventBtn')?.addEventListener('click', () => {
    eventMod.eventInfo.name = qs('evtName')?.value || '';
    eventMod.eventInfo.date = qs('evtDate')?.value || '';
    eventMod.eventInfo.loc = qs('evtLoc')?.value || '';
    eventMod.eventInfo.desc = qs('evtDesc')?.value || '';
    eventMod.saveEventInfo();
    alert('Event saved.');
    renderEventHome();
    updateStats();
  });
  qs('genQRBtn')?.addEventListener('click', () => generateQR('qrBox', JSON.stringify(eventMod.eventInfo), 200));
}

// helpers
function updateStats(){
  qs('statCount').textContent = gallery.artworks.length || 0;
  qs('statEvents').textContent = eventMod.eventGallery.length || 0;
  qs('statRecent').textContent = gallery.artworks.length ? (gallery.artworks[gallery.artworks.length-1].title || '—') : '—';
}

function renderAllGalleries(){
  renderArtistGrid(); renderPublicGallery(); renderManageList(); renderEventHome(); updateStats();
}

// wire everything on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  wireNavigation();
  // profile
  loadProfileUI();
  setupProfile();
  // gallery/upload/manage
  setupGalleryUpload();
  renderAllGalleries();
  qs('applyEditBtn')?.addEventListener('click', applyEdit);
  // viewer keys
  document.addEventListener('keydown', (e) => {
    if (!qs('viewerOverlay')) return;
    if (!qs('viewerOverlay').classList.contains('hidden')) {
      if (e.key === 'ArrowLeft') viewerPrev();
      if (e.key === 'ArrowRight') viewerNext();
      if (e.key === 'Escape') closeViewer();
    }
  });
  // event
  setupEventUI();
  // expose some debugging globals
  window._gallery = gallery;
  window._profile = profile;
  window._event = eventMod;
});
