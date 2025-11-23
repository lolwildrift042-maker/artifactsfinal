// utils.js — small DOM + formatting helpers
export const qs = id => document.getElementById(id);
export const qsa = sel => Array.from(document.querySelectorAll(sel));

export function escapeHtml(s) {
  if (!s && s !== 0) return '';
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

export function placeholderImage() {
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='#efefef'/><text x='50%' y='50%' font-size='18' text-anchor='middle' fill='#999'>No image</text></svg>`
  );
}
