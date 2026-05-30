/* ============================================================
   Flow Orizon — paleta de cores e helpers puros (sem estado).
   ============================================================ */

// 16 cores pastéis, na ordem da grade 4x4 do modal.
export const PALETTE = [
  "#FFF9B0", "#FFD6E0", "#D6F5D6", "#D6E5FA",
  "#E5D4F1", "#FFDAB9", "#FFE5CC", "#FFCCCC",
  "#CCFFEB", "#E0F0FF", "#FFE5F0", "#F0E5D6",
  "#D6F0E0", "#FFEFD5", "#E5E5F5", "#F5F5DC",
];

export const DEFAULT_COLOR = "#FFF9B0";

export const COLOR_NAMES = {
  "#FFF9B0": "Amarelo", "#FFD6E0": "Rosa", "#D6F5D6": "Verde", "#D6E5FA": "Azul",
  "#E5D4F1": "Lavanda", "#FFDAB9": "Pêssego", "#FFE5CC": "Laranja claro", "#FFCCCC": "Rosa claro",
  "#CCFFEB": "Menta", "#E0F0FF": "Azul gelo", "#FFE5F0": "Rosa bebê", "#F0E5D6": "Creme",
  "#D6F0E0": "Verde água", "#FFEFD5": "Papaya", "#E5E5F5": "Lilás", "#F5F5DC": "Bege",
};

/* ---------- rotação determinística a partir do id ---------- */
// Hash estável -> rotação em [-3, +3] graus. Mesmo id => mesmo ângulo, sempre.
export function rotationFor(id) {
  const s = String(id);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const norm = ((h >>> 0) % 100000) / 100000;
  return +(norm * 6 - 3).toFixed(2);
}

/* ---------- datas ---------- */
export const MONTHS_SHORT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

// Usa só a parte de data (YYYY-MM-DD) para mostrar o dia do calendário,
// evitando deslocamento de fuso quando a API devolve datetime.
function dateOnly(iso) {
  return new Date(String(iso).slice(0, 10) + "T00:00:00");
}

export function fmtShortDate(iso) {
  if (!iso) return null;
  const d = dateOnly(iso);
  return `${d.getDate()}/${MONTHS_SHORT[d.getMonth()]}`;
}

export function fmtLongDate(iso) {
  if (!iso) return "—";
  const d = dateOnly(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function isOverdue(iso, completed) {
  if (!iso || completed) return false;
  return dateOnly(iso) < dateOnly(new Date().toISOString());
}

// Objeto agregador, espelhando o uso anterior (D.PALETTE, D.rotationFor, ...).
const D = {
  PALETTE,
  DEFAULT_COLOR,
  COLOR_NAMES,
  MONTHS_SHORT,
  rotationFor,
  fmtShortDate,
  fmtLongDate,
  isOverdue,
};

export default D;
