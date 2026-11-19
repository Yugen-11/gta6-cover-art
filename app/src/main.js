// Cover Snap: wires the editor — pick photos, arrange panels, write a caption,
// pick a grade, export the cover as a PNG. A `?shot=` query sets up a fixed
// scene for a screenshot instead (./shots.js). Photos never leave the machine.
import { drawCover, renderCover, GRADES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const panelLabel = document.getElementById('panel-label');

export const EXPORT_SIZES = {
  square: { w: 1080, h: 1080, label: 'Square 1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: 'Portrait 1080 × 1350' },
  landscape: { w: 1920, h: 1080, label: 'Landscape 1920 × 1080' },
  story: { w: 1080, h: 1920, label: 'Story 1080 × 1920' },
};

export const PRESETS = {
  heist: {
    layout: 'trio', grade: 'sunset', caption: 'Sunset Heist', subtitle: 'Leonida Nights',
    photos: ['boulevard', 'pier', 'boulevard'], zooms: [1.25, 1, 1.6], panx: [-0.4, 0, 0.5],
  },
  neon: {
    layout: 'duo', grade: 'neon', caption: 'Neon Nights', subtitle: 'After Dark',
    photos: ['pier', 'boulevard'], zooms: [1, 1.1], panx: [0, 0],
  },
  queen: {
    layout: 'single', grade: 'dusk', caption: 'Boulevard Queen', subtitle: 'Golden Hour',
    photos: ['boulevard'], zooms: [1.15], panx: [0],
  },
};

const state = {
  layout: 'duo',
  panels: [
    { img: null, zoom: 1, ox: 0, oy: 0 },
    { img: null, zoom: 1, ox: 0, oy: 0 },
    { img: null, zoom: 1, ox: 0, oy: 0 },
  ],
  caption: 'Sunset Heist',
  subtitle: 'Leonida Nights',
  captionPos: 'bottom',
  captionScale: 1,
  grade: 'sunset',
  exportSize: 'square',
};
let selected = 0;

function panelCount() {
  return state.layout === 'trio' ? 3 : state.layout === 'duo' ? 2 : 1;
}

function setCanvasSize() {
  const size = EXPORT_SIZES[state.exportSize];
  canvas.width = size.w;
  canvas.height = size.h;
}

function redraw() {
  drawCover(canvas, state);
  updatePanelControls();
}

function updatePanelControls() {
  const count = panelCount();
  if (selected >= count) selected = 0;
  const panel = state.panels[selected];
  panelLabel.textContent = `Panel ${selected + 1} of ${count}${panel.img ? '' : ' — empty'}`;
  document.getElementById('zoom').value = panel.zoom;
  document.getElementById('panx').value = panel.ox;
  document.getElementById('pany').value = panel.oy;
  document.getElementById('zoom-val').textContent = `${panel.zoom.toFixed(2)}×`;
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadSample(name, intoPanel) {
  const img = await loadImage(`samples/${name}.jpg`);
  const target = intoPanel ?? selected;
  state.panels[target] = { img, zoom: 1, ox: 0, oy: 0 };
  selected = target;
  redraw();
}

function placeFiles(files) {
  const images = [...files].filter((f) => f.type.startsWith('image/'));
  if (!images.length) { status.textContent = 'That was not an image file.'; return; }
  let slot = selected;
  let loaded = 0;
  images.forEach((file) => {
    loadImage(URL.createObjectURL(file)).then((img) => {
      // Fill the selected panel first, then the next empty ones, then wrap.
      let at = slot;
      for (let tries = 0; tries < panelCount(); tries++) {
        const candidate = (slot + tries) % panelCount();
        if (!state.panels[candidate].img) { at = candidate; break; }
        at = candidate;
      }
      state.panels[at] = { img, zoom: 1, ox: 0, oy: 0 };
      selected = at;
      slot = (at + 1) % panelCount();
      loaded += 1;
      status.textContent = `Loaded ${loaded} photo${loaded === 1 ? '' : 's'} — drag on the cover to position, scroll to zoom.`;
      redraw();
    }).catch(() => { status.textContent = 'Could not read that image file.'; });
  });
}

function applyPreset(name) {
  const preset = PRESETS[name];
  if (!preset) return;
  state.layout = preset.layout;
  state.grade = preset.grade;
  state.caption = preset.caption;
  state.subtitle = preset.subtitle;
  document.getElementById('caption').value = preset.caption;
  document.getElementById('subtitle').value = preset.subtitle;
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === preset.layout));
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === preset.grade));
  selected = 0;
  preset.photos.forEach((photo, i) => {
    loadSample(photo, i).then(() => {
      const panel = state.panels[i];
      panel.zoom = preset.zooms[i] || 1;
      panel.ox = preset.panx[i] || 0;
      redraw();
    });
  });
  status.textContent = `Preset “${preset.caption}” loaded — export it or make it yours.`;
}

function exportPNG() {
  const size = EXPORT_SIZES[state.exportSize];
  const out = renderCover(state, size.w, size.h);
  out.toBlob((blob) => {
    if (!blob) { status.textContent = 'Export failed — try again.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cover-${size.w}x${size.h}.png`;
    a.click();
    status.textContent = `Saved cover-${size.w}x${size.h}.png`;
  }, 'image/png');
}

// --- Controls ---------------------------------------------------------------
document.getElementById('photo').addEventListener('change', (e) => {
  placeFiles(e.target.files);
  e.target.value = '';
});
document.querySelectorAll('[data-sample]').forEach((button) => {
  button.addEventListener('click', () => loadSample(button.dataset.sample).catch(() => {
    status.textContent = 'Could not load that sample photo.';
  }));
});
document.getElementById('fill-samples').addEventListener('click', () => {
  const names = ['boulevard', 'pier', 'boulevard'];
  for (let i = 0; i < panelCount(); i++) loadSample(names[i], i);
  status.textContent = 'Sample photos loaded into every panel.';
});
document.querySelectorAll('[data-layout]').forEach((button) => {
  button.addEventListener('click', () => {
    state.layout = button.dataset.layout;
    document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b === button));
    redraw();
  });
});
document.querySelectorAll('[data-grade]').forEach((button) => {
  button.addEventListener('click', () => {
    state.grade = button.dataset.grade;
    document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b === button));
    redraw();
  });
});
document.querySelectorAll('[data-preset]').forEach((button) => {
  button.addEventListener('click', () => applyPreset(button.dataset.preset));
});
document.getElementById('caption').addEventListener('input', (e) => { state.caption = e.target.value; redraw(); });
document.getElementById('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
document.querySelectorAll('[data-pos]').forEach((button) => {
  button.addEventListener('click', () => {
    state.captionPos = button.dataset.pos;
    document.querySelectorAll('[data-pos]').forEach((b) => b.classList.toggle('active', b === button));
    redraw();
  });
});
document.getElementById('caption-size').addEventListener('input', (e) => {
  state.captionScale = Number(e.target.value);
  document.getElementById('caption-size-val').textContent = `${Math.round(state.captionScale * 100)}%`;
  redraw();
});
document.getElementById('zoom').addEventListener('input', (e) => {
  state.panels[selected].zoom = Number(e.target.value);
  redraw();
});
document.getElementById('panx').addEventListener('input', (e) => {
  state.panels[selected].ox = Number(e.target.value);
  redraw();
});
document.getElementById('pany').addEventListener('input', (e) => {
  state.panels[selected].oy = Number(e.target.value);
  redraw();
});
document.getElementById('panel-fit').addEventListener('click', () => {
  state.panels[selected].zoom = 1;
  state.panels[selected].ox = 0;
  state.panels[selected].oy = 0;
  redraw();
});
document.getElementById('export-size').addEventListener('change', (e) => {
  state.exportSize = e.target.value;
  setCanvasSize();
  redraw();
});
document.getElementById('export').addEventListener('click', exportPNG);

// --- Canvas pointer: click selects a panel, drag pans it, wheel zooms it ----
function panelAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) / rect.width;
  const count = panelCount();
  const index = Math.min(count - 1, Math.max(0, Math.floor(x * count)));
  return { index, rect };
}
let dragging = null;
canvas.addEventListener('pointerdown', (e) => {
  const { index } = panelAt(e.clientX, e.clientY);
  selected = index;
  dragging = { x: e.clientX, y: e.clientY, ox: state.panels[index].ox, oy: state.panels[index].oy };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  const panel = state.panels[selected];
  // Dragging right moves the photo right (pan the view the other way round
  // feels wrong, so the photo follows the pointer).
  panel.ox = Math.max(-1, Math.min(1, dragging.ox + ((e.clientX - dragging.x) / rect.width) * 2));
  panel.oy = Math.max(-1, Math.min(1, dragging.oy + ((e.clientY - dragging.y) / rect.height) * 2));
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const panel = state.panels[selected];
  panel.zoom = Math.max(1, Math.min(3, panel.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08)));
  redraw();
}, { passive: false });

// --- Drag and drop anywhere on the preview ----------------------------------
const stage = document.getElementById('stage');
['dragenter', 'dragover'].forEach((name) => stage.addEventListener(name, (e) => {
  e.preventDefault();
  stage.classList.add('dropping');
}));
['dragleave', 'drop'].forEach((name) => stage.addEventListener(name, (e) => {
  e.preventDefault();
  stage.classList.remove('dropping');
}));
stage.addEventListener('drop', (e) => placeFiles(e.dataTransfer.files));

// --- Test hooks: the probe script renders and checks an export through these.
function selectPanel(i) { selected = Math.max(0, Math.min(panelCount() - 1, i)); redraw(); }
window.__cover = { state, drawCover, renderCover, EXPORT_SIZES, setCanvasSize, redraw, selectPanel };

// --- Boot --------------------------------------------------------------------
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
setCanvasSize();
if (shot) {
  runShot(shot, params, { state, loadSample, loadImage, redraw, setCanvasSize, canvas, selectPanel });
} else {
  // Default scene: both samples in, ready to export in one click.
  Promise.all([loadSample('boulevard', 0), loadSample('pier', 1)]).then(() => {
    redraw();
    window.__ready = true;
  });
  redraw();
  window.__ready = true;
}
