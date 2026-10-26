import { initPreview, updatePreview } from './preview.js';
import { createSignGeometry } from './geometry.js';
import { downloadStl, downloadObj } from './export.js';
import { loadBuiltinFonts, loadCustomFont, getCurrentFont } from './font.js';

const state = {
  text: '',
  font: 'builtin-sans',
  ledProfile: 'WS2812B'
};

loadBuiltinFonts().then(() => console.log("Fonts loaded"));

const preview = initPreview(document.getElementById('previewContainer'));

function collectOptions() {
  return { ...state, fontObject: getCurrentFont(state) };
}

function refreshGeometry() {
  const mesh = createSignGeometry(collectOptions());
  updatePreview(preview, mesh);
}

document.getElementById('generateModel').addEventListener('click', refreshGeometry);

document.getElementById('textInput').addEventListener('input', e => {
  state.text = e.target.value;
});

document.getElementById('fontSelect').addEventListener('change', e => {
  state.font = e.target.value;
});

document.getElementById('fontUpload').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  await loadCustomFont(file);
  state.font = "custom";
});

document.getElementById('ledProfile').addEventListener('change', e => {
  state.ledProfile = e.target.value;
});
