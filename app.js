import { initPreview, updatePreview } from './preview.js';
import { createSignGeometry } from './geometry.js';
import { downloadStl, downloadObj } from './export.js';
import { loadBuiltinFonts, loadCustomFont, getCurrentFont } from './font.js';

const state = {
  text: '',
  font: 'builtin-sans',
  ledProfile: 'WS2812B',
  backingThickness: 4
};

loadBuiltinFonts().then(() => {
  console.log("Fonts loaded");
});

const preview = initPreview(document.getElementById('previewContainer'));

function collectOptions() {
  return {
    ...state,
    fontObject: getCurrentFont(state)
  };
}

function refreshGeometry() {
  const mesh = createSignGeometry(collectOptions());
  updatePreview(preview, mesh);
}

function setupUi() {
  const byId = id => document.getElementById(id);

  byId('generateModel').addEventListener('click', refreshGeometry);

  byId('textInput').addEventListener('input', e => {
    state.text = e.target.value;
  });

  byId('fontSelect').addEventListener('change', e => {
    state.font = e.target.value;
  });

  byId('fontUpload').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    await loadCustomFont(file);
    state.font = "custom";
  });

  byId('ledProfile').addEventListener('change', e => {
    state.ledProfile = e.target.value;
  });

  byId('downloadStl').addEventListener('click', () => {
    const mesh = createSignGeometry(collectOptions());
    downloadStl(mesh);
  });

  byId('downloadObj').addEventListener('click', () => {
    const mesh = createSignGeometry(collectOptions());
    downloadObj(mesh);
  });
}

setupUi();
