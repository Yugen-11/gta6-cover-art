// Draws GTA-style multi-panel cover art: the photos in white-framed panels,
// a colour grade over each panel, and a bold outlined caption across the cover.
//
// State shape (see main.js):
//   layout: 'single' | 'duo' | 'trio'
//   panels: [{ img, zoom, ox, oy }] — one slot per panel; img may be null
//   caption, subtitle: strings
//   captionPos: 'bottom' | 'top' | 'center'
//   captionScale: number, 0.7–1.5
//   grade: 'sunset' | 'neon' | 'dusk' | 'none'

export const GRADES = {
  sunset: {
    label: 'Vice City Sunset',
    wash: 'rgba(255, 130, 50, 0.10)',
    top: 'rgba(255, 190, 110, 0.10)',
    bottom: 'rgba(198, 32, 110, 0.55)',
    mid: 'rgba(255, 110, 70, 0.18)',
    accent: '#ffd23e',
  },
  neon: {
    label: 'Neon Nights',
    wash: 'rgba(150, 40, 255, 0.12)',
    top: 'rgba(80, 60, 255, 0.16)',
    bottom: 'rgba(255, 40, 160, 0.52)',
    mid: 'rgba(190, 60, 255, 0.20)',
    accent: '#ff5ce1',
  },
  dusk: {
    label: 'Palm Dusk',
    wash: 'rgba(20, 40, 90, 0.14)',
    top: 'rgba(30, 60, 120, 0.14)',
    bottom: 'rgba(8, 8, 38, 0.58)',
    mid: 'rgba(40, 30, 90, 0.22)',
    accent: '#9ad1ff',
  },
  none: {
    label: 'No Grade',
    wash: 'rgba(0, 0, 0, 0)',
    top: 'rgba(0, 0, 0, 0)',
    bottom: 'rgba(0, 0, 0, 0.34)',
    mid: 'rgba(0, 0, 0, 0)',
    accent: '#ffffff',
  },
};

/** Panel rectangles for a layout: white frame + gutters, panels left to right. */
export function panelRects(width, height, layout) {
  const count = layout === 'trio' ? 3 : layout === 'duo' ? 2 : 1;
  const frame = Math.max(4, Math.round(Math.min(width, height) * 0.012));
  const gutter = frame;
  const innerX = frame;
  const innerY = frame;
  const innerW = width - frame * 2;
  const innerH = height - frame * 2;
  const panelW = (innerW - gutter * (count - 1)) / count;
  const rects = [];
  for (let i = 0; i < count; i++) {
    rects.push({ x: innerX + i * (panelW + gutter), y: innerY, w: panelW, h: innerH });
  }
  return { rects, frame };
}

/** Draws one photo into a panel rect, cover-fit, with zoom and pan. */
function drawPhoto(ctx, img, rect, zoom, ox, oy) {
  if (!img || !img.naturalWidth) {
    // Placeholder panel: deep gradient, a sun disc and a horizon — intentional, not broken.
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    g.addColorStop(0, '#3b1150');
    g.addColorStop(0.55, '#7a1e5e');
    g.addColorStop(1, '#12081f');
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    const sunR = rect.w * 0.16;
    const sun = ctx.createRadialGradient(
      rect.x + rect.w / 2, rect.y + rect.h * 0.42, sunR * 0.1,
      rect.x + rect.w / 2, rect.y + rect.h * 0.42, sunR,
    );
    sun.addColorStop(0, 'rgba(255, 214, 120, 0.95)');
    sun.addColorStop(1, 'rgba(255, 120, 60, 0)');
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(rect.x + rect.w / 2, rect.y + rect.h * 0.42, sunR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(10, 4, 20, 0.35)';
    ctx.fillRect(rect.x, rect.y + rect.h * 0.62, rect.w, rect.h * 0.38);
    return;
  }
  const fit = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const scale = fit * Math.max(1, zoom || 1);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const slackX = Math.max(0, dw - rect.w) / 2;
  const slackY = Math.max(0, dh - rect.h) / 2;
  const dx = rect.x + (rect.w - dw) / 2 - slackX * (ox || 0);
  const dy = rect.y + (rect.h - dh) / 2 - slackY * (oy || 0);
  ctx.drawImage(img, dx, dy, dw, dh);
}

/** A colour grade + vignette over one panel rect. */
function drawGrade(ctx, rect, grade) {
  const g = GRADES[grade] || GRADES.sunset;
  ctx.fillStyle = g.wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const tint = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  tint.addColorStop(0, g.top);
  tint.addColorStop(0.55, g.mid);
  tint.addColorStop(1, g.bottom);
  ctx.fillStyle = tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const vig = ctx.createRadialGradient(
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.35,
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(0, 0, 0, 0.20)');
  ctx.fillStyle = vig;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

/** Wraps text to lines that fit maxWidth at the given font. */
function wrapLines(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !line) line = next;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

/** Draws the caption (+ subtitle) across the cover at the chosen position. */
function drawCaption(ctx, width, height, state) {
  const grade = GRADES[state.grade] || GRADES.sunset;
  const text = (state.caption || '').trim().toUpperCase();
  const sub = (state.subtitle || '').trim();
  if (!text && !sub) return;
  const pos = state.captionPos || 'bottom';
  const scale = state.captionScale || 1;
  const maxW = width * 0.88;

  // Pick a base size, then shrink until the longest line fits.
  let size = height * 0.115 * scale;
  const setFont = (s) => { ctx.font = `900 ${s}px 'Arial Black', 'Segoe UI', system-ui, sans-serif`; };
  setFont(size);
  let lines = text ? wrapLines(ctx, text, maxW) : [];
  while (lines.length && ctx.measureText(lines.reduce((a, b) => (a.length > b.length ? a : b))).width > maxW && size > 14) {
    size -= 2;
    setFont(size);
    lines = wrapLines(ctx, text, maxW);
  }
  const subSize = Math.max(16, size * 0.30);
  const lineH = size * 1.08;
  const blockH = lines.length * lineH + (sub ? subSize * 1.9 : 0);

  // Legibility scrim behind the text.
  let bandY, bandH;
  if (pos === 'top') { bandY = 0; bandH = blockH + height * 0.06; }
  else if (pos === 'center') { bandY = (height - blockH) / 2 - height * 0.03; bandH = blockH + height * 0.06; }
  else { bandY = height - blockH - height * 0.045; bandH = blockH + height * 0.075; }
  const scrim = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
  if (pos === 'top') {
    scrim.addColorStop(0, 'rgba(10, 4, 24, 0.62)');
    scrim.addColorStop(1, 'rgba(10, 4, 24, 0)');
  } else if (pos === 'bottom') {
    scrim.addColorStop(0, 'rgba(10, 4, 24, 0)');
    scrim.addColorStop(1, 'rgba(10, 4, 24, 0.62)');
  } else {
    scrim.addColorStop(0, 'rgba(10, 4, 24, 0)');
    scrim.addColorStop(0.5, 'rgba(10, 4, 24, 0.55)');
    scrim.addColorStop(1, 'rgba(10, 4, 24, 0)');
  }
  ctx.fillStyle = scrim;
  ctx.fillRect(0, Math.max(0, bandY), width, Math.min(height, bandH));

  // Caption lines.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  try { ctx.letterSpacing = '0.03em'; } catch { /* older canvas: no letter spacing */ }
  const firstBaseline = pos === 'top'
    ? height * 0.045 + size
    : pos === 'center'
      ? (height - blockH) / 2 + size
      : height - height * 0.045 - (sub ? subSize * 1.9 : 0) - (lines.length - 1) * lineH;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(18, 4, 28, 0.92)';
  ctx.lineWidth = Math.max(2, size * 0.14);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = size * 0.10;
  ctx.shadowOffsetY = size * 0.03;
  lines.forEach((line, i) => {
    const y = firstBaseline + i * lineH;
    ctx.strokeText(line, width / 2, y);
    ctx.fillText(line, width / 2, y);
  });
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Subtitle, smaller and letterspaced, in the grade's accent colour.
  if (sub) {
    ctx.font = `700 ${subSize}px 'Segoe UI', system-ui, sans-serif`;
    try { ctx.letterSpacing = '0.32em'; } catch { /* ignore */ }
    ctx.fillStyle = grade.accent;
    ctx.strokeStyle = 'rgba(18, 4, 28, 0.85)';
    ctx.lineWidth = Math.max(1.5, subSize * 0.12);
    const subY = firstBaseline + (lines.length - 1) * lineH + lineH * 0.55 + subSize * 0.5;
    ctx.strokeText(sub.toUpperCase(), width / 2, subY);
    ctx.fillText(sub.toUpperCase(), width / 2, subY);
    try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
  }
}

/** Draws the whole cover onto the canvas's 2D context, at the canvas's own size. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const { rects } = panelRects(w, h, state.layout || 'single');
  // White frame + gutters, the poster grid.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  const panels = state.panels || [];
  rects.forEach((rect, i) => {
    const panel = panels[i] || { img: null, zoom: 1, ox: 0, oy: 0 };
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    drawPhoto(ctx, panel.img, rect, panel.zoom, panel.ox, panel.oy);
    drawGrade(ctx, rect, state.grade || 'sunset');
    ctx.restore();
  });
  drawCaption(ctx, w, h, state);
}

/** Renders the cover at an export size and returns the canvas. */
export function renderCover(state, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawCover(canvas, state);
  return canvas;
}
