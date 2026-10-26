import { initPreview, updatePreview } from './preview.js';
import { createSignGeometry } from './geometry.js';
import { downloadStl, downloadObj, download3mf } from './export.js';
import { loadBuiltinFonts, loadCustomFont, getCurrentFont } from './font.js';

const state = {
  text: '',
  font: 'builtin-sans',
  signType: 'tube',
  ledProfile: 'WS2812B',
  backingThickness: 4,
  holesEnabled: false,
  holeDiameter: 4,
  holeOffset: 10,
  postsEnabled: false,
  postLength: 15,
  slatEnabled: false,
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
  const options = collectOptions();
  const mesh = createSignGeometry(options);
  updatePreview(preview, mesh);
}

function setupUi() {
  const byId = (id) => document.getElementById(id);

  byId('generateModel').addEventListener('click', () => {
    refreshGeometry();
  });

  byId('textInput').addEventListener('input', (e) => {
    state.text = e.target.value;
  });

  byId('fontSelect').addEventListener('change', (e) => {
    state.font = e.target.value;
  });

  byId('fontUpload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await loadCustomFont(file);
    state.font = "custom";
  });

  byId('signType').addEventListener('change', (e) => {
    state.signType = e.target.value;
  });

  byId('ledProfile').addEventListener('change', (e) => {
    state.ledProfile = e.target.value;
  });

  byId('backingThickness').addEventListener('input', (e) => {
    state.backingThickness = Number(e.target.value);
  });

  byId('holesEnabled').addEventListener('change', (e) => {
    state.holesEnabled = e.target.checked;
  });

  byId('holeDiameter').addEventListener('input', (e) => {
    state.holeDiameter = Number(e.target.value);
  });

  byId('holeOffset').addEventListener('input', (e) => {
    state.holeOffset = Number(e.target.value);
  });

  byId('postsEnabled').addEventListener('change', (e) => {
    state.postsEnabled = e.target.checked;
  });

  byId('postLength').addEventListener('input', (e) => {
    state.postLength = Number(e.target.value);
  });

  byId('slatEnabled').addEventListener('change', (e) => {
    state.slatEnabled = e.target.checked;
  });

  byId('downloadStl').addEventListener('click', () => {
    const mesh = createSignGeometry(collectOptions());
    downloadStl(mesh);
  });

  byId('downloadObj').addEventListener('click', () => {
    const mesh = createSignGeometry(collectOptions());
    downloadObj(mesh);
  });

  byId('download3mf').addEventListener('click', () => {
    const mesh = createSignGeometry(collectOptions());
    download3mf(mesh);
  });
}

setupUi();
