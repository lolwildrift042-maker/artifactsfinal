
// viewer.js — enhanced viewer with fade animation, swipe, pinch-to-zoom
import { qs } from './utils.js';
import { artworks } from './gallery.js';

let index = 0;
let scale = 1;
let lastTouchDistance = null;
let lastTouchCenter = null;
let pan = { x: 0, y: 0 };
let lastPan = { x: 0, y: 0 };
let isPanning = false;
let doubleTapTimeout = null;
let lastTap = 0;

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

export function openViewerAt(i) {
  index = i;
  scale = 1; pan = {x:0,y:0}; lastPan={x:0,y:0}; lastTouchDistance=null;
  showViewer();
}

function applyTransform(img){
  img.style.transform = `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`;
}

function resetImagePosition(img){
  scale = 1; pan = {x:0,y:0}; lastPan={x:0,y:0};
  img.style.transition = 'transform 180ms ease';
  applyTransform(img);
  setTimeout(()=> img.style.transition = '', 200);
}

function showViewer(){
  const art = artworks[index];
  if (!art) return;
  const overlay = qs('viewerOverlay');
  const img = qs('viewerImg');
  const cap = qs('viewerCaption');

  img.src = art.img || '';
  img.alt = art.title || 'Artwork';
  cap.innerHTML = `<strong style="display:block">${art.title||''}</strong><div style="color:#ddd;margin-top:6px">${art.desc||''}</div>`;

  // reset transforms
  img.style.transform = '';
  img.style.transition = '';
  img.style.willChange = 'transform';
  resetImagePosition(img);

  // show with fade
  overlay.classList.remove('hidden');
  overlay.classList.add('visible');
  // ensure buttons are on top (in case)
  document.querySelectorAll('.viewer-top, .viewer-close, .viewer-prev, .viewer-next').forEach(el => el.style.zIndex = 9999);

  // attach pointer / touch handlers
  attachViewerHandlers();
}

export function closeViewer() {
  const overlay = qs('viewerOverlay');
  if (!overlay) return;
  overlay.classList.remove('visible');
  overlay.classList.add('hidden');
  // reset scale/pan
  const img = qs('viewerImg');
  if (img) resetImagePosition(img);
  detachViewerHandlers();
}

export function viewerPrev() {
  if (!artworks.length) return;
  index = (index - 1 + artworks.length) % artworks.length;
  openViewerAt(index);
}

export function viewerNext() {
  if (!artworks.length) return;
  index = (index + 1) % artworks.length;
  openViewerAt(index);
}

// --- Touch / pointer handlers for swipe and pinch-to-zoom ---
let pointerState = {
  pointers: new Map()
};

function getDistance(t1, t2){
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.hypot(dx, dy);
}
function getCenter(t1, t2){
  return { x: (t1.clientX + t2.clientX)/2, y: (t1.clientY + t2.clientY)/2 };
}

function onPointerDown(e){
  e.preventDefault();
  pointerState.pointers.set(e.pointerId, e);
  const img = qs('viewerImg');
  if (!img) return;
  if (pointerState.pointers.size === 1){
    // possibly start pan or detect double tap
    const now = Date.now();
    if (now - lastTap < 300){
      // double tap -> toggle zoom
      if (scale > 1) resetImagePosition(img);
      else { scale = 2; applyTransform(img); }
      lastTap = 0;
    } else {
      lastTap = now;
    }
    isPanning = true;
  } else if (pointerState.pointers.size === 2){
    // start pinch
    const arr = Array.from(pointerState.pointers.values());
    lastTouchDistance = getDistance(arr[0], arr[1]);
    lastTouchCenter = getCenter(arr[0], arr[1]);
  }
}

function onPointerMove(e){
  if (!pointerState.pointers.has(e.pointerId)) return;
  pointerState.pointers.set(e.pointerId, e);
  const img = qs('viewerImg');
  if (!img) return;
  if (pointerState.pointers.size === 1 && isPanning){
    // pan
    const p = Array.from(pointerState.pointers.values())[0];
    // move relative to previous pointer stored in lastPan
    pan.x = lastPan.x + (p.clientX - p.pressX);
    pan.y = lastPan.y + (p.clientY - p.pressY);
    applyTransform(img);
  } else if (pointerState.pointers.size === 2){
    const arr = Array.from(pointerState.pointers.values());
    const dist = getDistance(arr[0], arr[1]);
    const center = getCenter(arr[0], arr[1]);
    if (lastTouchDistance){
      const delta = dist / lastTouchDistance;
      const newScale = clamp(scale * delta, 1, 4);
      // adjust pan so zoom centers on touch center
      const rect = img.getBoundingClientRect();
      const cx = center.x - rect.left;
      const cy = center.y - rect.top;
      // compute offsets
      const prevScale = scale;
      scale = newScale;
      // adjust pan to keep center stable
      pan.x = (pan.x - cx) * (scale / prevScale) + cx;
      pan.y = (pan.y - cy) * (scale / prevScale) + cy;
      applyTransform(img);
    }
    lastTouchDistance = dist;
    lastTouchCenter = center;
  }
}

function onPointerUp(e){
  pointerState.pointers.delete(e.pointerId);
  const img = qs('viewerImg');
  if (!img) return;
  if (pointerState.pointers.size === 0){
    // end pan
    lastPan.x = pan.x;
    lastPan.y = pan.y;
    isPanning = false;
    lastTouchDistance = null;
    // if scale is approx 1, reset transforms to avoid tiny offsets
    if (scale <= 1.01) resetImagePosition(img);
  } else if (pointerState.pointers.size === 1){
    // keep one pointer for panning
    const remaining = Array.from(pointerState.pointers.values())[0];
    // store initial press coords for panning
    remaining.pressX = remaining.clientX;
    remaining.pressY = remaining.clientY;
  }
}

// For swipe detection when not panning/zooming (single touch quick horizontal swipe)
let swipeStart = null;
function onTouchStartSwipe(e){
  if (e.touches && e.touches.length === 1){
    const t = e.touches[0];
    swipeStart = { x: t.clientX, y: t.clientY, time: Date.now() };
  }
}
function onTouchEndSwipe(e){
  if (!swipeStart) return;
  const t = (e.changedTouches && e.changedTouches[0]) || null;
  if (!t) { swipeStart = null; return; }
  const dx = t.clientX - swipeStart.x;
  const dt = Date.now() - swipeStart.time;
  if (Math.abs(dx) > 60 && dt < 500){
    if (dx < 0) viewerNext(); else viewerPrev();
  }
  swipeStart = null;
}

let attached = false;
function attachViewerHandlers(){
  if (attached) return;
  attached = true;
  const overlay = qs('viewerOverlay');
  const img = qs('viewerImg');
  // Pointer events for pan/pinch
  overlay.style.touchAction = 'none'; // allow pinch/drag
  overlay.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
  // touch events for swipe
  overlay.addEventListener('touchstart', onTouchStartSwipe, {passive:true});
  overlay.addEventListener('touchend', onTouchEndSwipe, {passive:true});
  // double-click / double-tap support for desktop mouse
  img.addEventListener('dblclick', () => {
    if (scale > 1) resetImagePosition(img);
    else { scale = 2; applyTransform(img); }
  });
}

function detachViewerHandlers(){
  if (!attached) return;
  attached = false;
  const overlay = qs('viewerOverlay');
  const img = qs('viewerImg');
  overlay.style.touchAction = '';
  overlay.removeEventListener('pointerdown', onPointerDown);
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
  window.removeEventListener('pointercancel', onPointerUp);
  overlay.removeEventListener('touchstart', onTouchStartSwipe);
  overlay.removeEventListener('touchend', onTouchEndSwipe);
  img.removeEventListener('dblclick', () => {});
}

// expose globals for HTML buttons
window.openViewerAt = openViewerAt;
window.closeViewer = closeViewer;
window.viewerPrev = viewerPrev;
window.viewerNext = viewerNext;
