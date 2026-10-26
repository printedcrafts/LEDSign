import opentype from "https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/dist/opentype.min.js";

let builtinSans = null;
let builtinScript = null;
let customFont = null;

export async function loadBuiltinFonts() {
  builtinSans = await opentype.load("https://fonts.gstatic.com/s/opensans/v34/mem8YaGs126MiZpBA-UFVZ0e.ttf");
  builtinScript = await opentype.load("https://fonts.gstatic.com/s/dancingscript/v17/If2RXTr6YS-zF4S-kcSWSVi_kQ.ttf");
}

export async function loadCustomFont(file) {
  const buffer = await file.arrayBuffer();
  customFont = opentype.parse(buffer);
}

export function getCurrentFont(state) {
  if (state.font === "custom" && customFont) return customFont;
  if (state.font === "builtin-script") return builtinScript;
  return builtinSans;
}

export function getTextPath(font, text, size = 80) {
  return font.getPath(text, 0, 0, size).commands;
}
