// qr.js — simple offline QR generator using an SVG placeholder (not a real QR library)
import { qs } from './utils.js';

export function generateQR(boxId, payload, size=200) {
  const data = String(payload || '');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><rect width='100%' height='100%' fill='#000'/><text x='50%' y='50%' fill='#fff' text-anchor='middle' font-size='8'>${encodeURIComponent(data).slice(0,150)}</text></svg>`;
  const img = document.createElement('img');
  img.src = 'data:image/svg+xml;utf8,' + svg;
  const box = qs(boxId);
  if (!box) return;
  box.innerHTML = '';
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'contain';
  box.appendChild(img);
}
