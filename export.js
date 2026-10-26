import { STLExporter } from 'https://unpkg.com/three@0.165.0/examples/jsm/exporters/STLExporter.js';
import { OBJExporter } from 'https://unpkg.com/three@0.165.0/examples/jsm/exporters/OBJExporter.js';

function triggerDownload(dataStr, filename, mime) {
  const blob = new Blob([dataStr], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadStl(mesh) {
  const exporter = new STLExporter();
  const stlString = exporter.parse(mesh);
  triggerDownload(stlString, 'sign.stl', 'application/vnd.ms-pki.stl');
}

export function downloadObj(mesh) {
  const exporter = new OBJExporter();
  const objString = exporter.parse(mesh);
  triggerDownload(objString, 'sign.obj', 'text/plain');
}

export function download3mf(mesh) {
  const exporter = new STLExporter();
  const stlString = exporter.parse(mesh);
  triggerDownload(stlString, 'sign.3mf', 'application/octet-stream');
}
