// Fixed scenes for screenshots: ?shot=editor shows the editor with photos loaded;
// ?shot=cover shows the cover alone, drawn at the export size named by cw/ch.
// Query params: layout, grade, photos (comma list) or photo, caption, subtitle,
// pos (bottom|top|center), size (square|portrait|landscape|story), cw, ch,
// zoom and panx (comma lists per panel). window.__shotReady is set once painted.
export async function runShot(shot, query, api) {
  const { state, loadSample, redraw, setCanvasSize, canvas } = api;
  const isCover = shot === 'cover';
  if (isCover) document.body.classList.add('shot-cover');

  const list = (name) => (query.get(name) || '').split(',').map((s) => s.trim()).filter(Boolean);
  state.layout = query.get('layout') || 'trio';
  state.grade = query.get('grade') || 'sunset';
  state.caption = query.get('caption') ?? 'Sunset Heist';
  state.subtitle = query.get('subtitle') ?? '';
  state.captionPos = query.get('pos') || 'bottom';
  const sizeKey = query.get('size') || 'square';
  state.exportSize = sizeKey;
  const select = document.getElementById('export-size');
  if (select) select.value = sizeKey;
  const captionInput = document.getElementById('caption');
  if (captionInput) captionInput.value = state.caption;
  const subtitleInput = document.getElementById('subtitle');
  if (subtitleInput) subtitleInput.value = state.subtitle;
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  document.querySelectorAll('[data-pos]').forEach((b) => b.classList.toggle('active', b.dataset.pos === state.captionPos));

  // Canvas pixel size: cw/ch for a cover shot (the export size), else the editor preview.
  if (isCover) {
    canvas.width = Number(query.get('cw') || 1080);
    canvas.height = Number(query.get('ch') || 1080);
  } else {
    setCanvasSize();
  }

  const photos = list('photos');
  if (!photos.length && query.get('photo')) photos.push(query.get('photo'));
  if (!photos.length) photos.push('boulevard', 'pier');
  const zooms = list('zoom').map(Number);
  const panx = list('panx').map(Number);
  const pany = list('pany').map(Number);
  const count = state.layout === 'trio' ? 3 : state.layout === 'duo' ? 2 : 1;
  for (let i = 0; i < count; i++) {
    const name = photos[i % photos.length];
    // eslint-disable-next-line no-await-in-loop
    await loadSample(name, i);
    const panel = state.panels[i];
    if (zooms[i]) panel.zoom = zooms[i];
    if (panx[i] !== undefined && !Number.isNaN(panx[i])) panel.ox = panx[i];
    if (pany[i] !== undefined && !Number.isNaN(pany[i])) panel.oy = pany[i];
  }
  if (api.selectPanel) api.selectPanel(0);
  redraw();

  if (isCover) {
    // Fit the cover into the viewport, keeping its aspect.
    const scale = Math.min(window.innerWidth / canvas.width, window.innerHeight / canvas.height);
    canvas.style.width = `${Math.floor(canvas.width * scale)}px`;
    canvas.style.height = `${Math.floor(canvas.height * scale)}px`;
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
