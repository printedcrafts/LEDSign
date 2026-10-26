import { initPreview, updatePreview } from './preview.js';
import { createSignGeometry } from './geometry.js';
import { downloadStl, downloadObj, download3mf } from './export.js';

const state = {
  text: '',
  font: 'builtin-sans',
  signType: 'tube',
  ledProfile: 'medium',
  backingThickness: 4,
  holesEnabled: false,
  holeDiameter: 4,
  holeOffset: 10,
  postsEnabled: false,
  postLength: 15,
  slatEnabled: false,
};

const preview = initPreview(document.getElementById('previewContainer'));

function collectOptions() {
  return { ...state };
}

function refreshGeometry() {
  const options = collectOptions();
  const mesh = createSignGeometry(options);
  updatePreview(preview, mesh);
}

function setupUi() {
  const byId = (id) => document.getElementById(id);

  byId('textInput').addEventListener('input', (e) => {
    state.text = e.target.value;
    refreshGeometry();
  });

  byId('fontSelect').addEventListener('change', (e) => {
    state.font = e.target.value;
    refreshGeometry();
  });

  byId('fontUpload').addEventListener('change', async (e) => {
    // stub for now – later we wire opentype.js here
    refreshGeometry();
  });

  byId('signType').addEventListener('change', (e) => {
    state.signType = e.target.value;
    refreshGeometry();
  });

  byId('ledProfile').addEventListener('change', (e) => {
    state.ledProfile = e.target.value;
    refreshGeometry();
  });

  byId('backingThickness').addEventListener('input', (e) => {
    state.backingThickness = Number(e.target.value);
    refreshGeometry();
  });

  byId('holesEnabled').addEventListener('change', (e) => {
    state.holesEnabled = e.target.checked;
    refreshGeometry();
  });

  byId('holeDiameter').addEventListener('input', (e) => {
    state.holeDiameter = Number(e.target.value);
    refreshGeometry();
  });

  byId('holeOffset').addEventListener('input', (e) => {
    state.holeOffset = Number(e.target.value);
    refreshGeometry();
  });

  byId('postsEnabled').addEventListener('change', (e) => {
    state.postsEnabled = e.target.checked;
    refreshGeometry();
  });

  byId('postLength').addEventListener('input', (e) => {
    state.postLength = Number(e.target.value);
    refreshGeometry();
  });

  byId('slatEnabled').addEventListener('change', (e) => {
    state.slatEnabled = e.target.checked;
    refreshGeometry();
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
refreshGeometry();
