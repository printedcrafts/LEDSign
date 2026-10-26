import opentype from "https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/dist/opentype.min.js";

let builtinSans = null;
let builtinScript = null;
let customFont = null;

// Load built-in fonts (JSON or TTF)
export async function loadBuiltinFonts() {
  builtinSans = await opentype.load("https://cdn.jsdelivr.net/npm/@fontsource/open-sans/files/open-sans-latin-400-normal.woff");
  builtinScript = await opentype.load("https://cdn.jsdelivr.net/npm/@fontsource/dancing-script/files/dancing-script-latin-400-normal.woff");
}

export async function loadCustomFont(file) {
  const buffer = await file.arrayBuffer();
  customFont = opentype.parse(buffer);
  return customFont;
}

export function getCurrentFont(state) {
  if (state.font === "custom" && customFont) return customFont;
  if (state.font === "builtin-script") return builtinScript;
  return builtinSans;
}

export function getTextPath(font, text, size = 80) {
  const path = font.getPath(text, 0, 0, size);
  return path.commands;
}
