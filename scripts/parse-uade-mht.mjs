/**
 * Extrae materias y correlativas anteriores desde un .mht exportado de WebCampus UADE.
 * Uso: node scripts/parse-uade-mht.mjs <archivo.mht> [salida.json]
 */
import fs from "fs";

const mhtPath = process.argv[2];
const outPath = process.argv[3] || "src/data/informatica-uade-2021.json";

if (!mhtPath) {
  console.error("Uso: node scripts/parse-uade-mht.mjs <ruta.mht> [salida.json]");
  process.exit(1);
}

let html = fs.readFileSync(mhtPath, "utf8");
const tblId = 'id="ctl00_ContentPlaceHolderMain_tbl_Materias"';
const tblIdx = html.indexOf(tblId);
if (tblIdx >= 0) {
  const tOpen = html.lastIndexOf("<table", tblIdx);
  const fragment = html.slice(tOpen);
  const re = /<table\b|<\/table>/gi;
  let depth = 0;
  let m;
  while ((m = re.exec(fragment)) !== null) {
    if (m[0].toLowerCase().startsWith("<table")) depth++;
    else depth--;
    if (depth === 0) {
      html = fragment.slice(0, m.index + "</table>".length);
      break;
    }
  }
}

const fixMojibake = (s) =>
  s
    .replace(/Â°/g, "°")
    .replace(/Ă­/g, "í")
    .replace(/Ăł/g, "ó")
    .replace(/ĂĄ/g, "á")
    .replace(/ĂŠ/g, "é")
    .replace(/Ăş/g, "ú")
    .replace(/Ăą/g, "ñ");

function levelAtIndex(full, idx) {
  const head = full.slice(0, idx);
  const years = [...head.matchAll(/yearFACU1[^>]*>[\s\S]*?<span>\s*(\d+)\s*[°Â°]\s*Año/gi)];
  const cus = [
    ...head.matchAll(/cuatrimestreFACU1[^>]*>[\s\S]*?<span>\s*(\d+)\s*[°Â°]\s*Cuatrimestre/gi),
  ];
  let ano = years.length ? parseInt(years[years.length - 1][1], 10) : 1;
  let cu = cus.length ? parseInt(cus[cus.length - 1][1], 10) - 1 : 0;
  return (ano - 1) * 2 + cu + 1;
}

function sliceDetailTrAfterMateriaRow(full, rowEndIdx) {
  let a = full.indexOf("</tr>", rowEndIdx);
  if (a < 0) return "";
  a = full.indexOf("<tr", a);
  if (a < 0) return "";
  if (!full.slice(a, a + 80).includes("ctl00_ContentPlaceHolderMain_")) return "";
  const tdStart = full.indexOf("<td", a);
  const tableStart = full.indexOf("<table", tdStart);
  if (tableStart < 0) return "";
  const re = /<table\b|<\/table>/gi;
  re.lastIndex = tableStart;
  let depth = 0;
  let m;
  while ((m = re.exec(full)) !== null) {
    if (m[0].toLowerCase().startsWith("<table")) depth++;
    else {
      depth--;
      if (depth === 0) {
        const afterTable = m.index + "</table>".length;
        const closeTd = full.indexOf("</td>", afterTable);
        const closeTr = full.indexOf("</tr>", closeTd);
        if (closeTr < 0) return "";
        return full.slice(a, closeTr + "</tr>".length);
      }
    }
  }
  return "";
}

function extractPrevCodes(detailTr, courseId) {
  const beforePost = detailTr.split("Correlativas Posteriores")[0] || "";
  if (/Correlativas Anteriores:\s*No posee/i.test(beforePost)) return [];
  const divM = beforePost.match(/id="ctl00_ContentPlaceHolderMain_ArbolAnt[^"]*"[\s\S]*?<\/div>/);
  if (!divM) return [];
  const hrefs = [...divM[0].matchAll(/#([\d.A-Za-z]+)(?:"|&)/g)].map((x) => x[1]);
  return [...new Set(hrefs)].filter((c) => c !== courseId);
}

const materias = [];
const rowRe =
  /<td class="materias2"[^>]*>\s*<span>([^<]*)<\/span>\s*<\/td>\s*<td class="materias">\s*<span>([^<]*)<\/span>\s*<\/td>/g;

let m;
while ((m = rowRe.exec(html)) !== null) {
  const rawCode = m[1].trim();
  const nombre = fixMojibake(m[2].trim());

  let id = rawCode;
  if (/^Optativa\s+/i.test(nombre)) {
    const rom = nombre.match(/(I{1,3})$/i);
    const n = rom ? ["I", "II", "III"].indexOf(rom[1].toUpperCase()) + 1 : 1;
    id = `UADE-OPT-${n}`;
  }

  const rowClose = html.indexOf("</tr>", m.index);
  const detailTr =
    rowClose >= 0 ? sliceDetailTrAfterMateriaRow(html, rowClose) : "";
  const prev = extractPrevCodes(detailTr, id);

  let categoria = "Materias Obligatorias";
  if (/^Optativa\s/i.test(nombre)) categoria = "Materias Electivas";
  else if (/Proyecto Final/i.test(nombre)) categoria = "Fin de Carrera (Obligatorio)";

  const level = levelAtIndex(html, m.index);

  materias.push({
    id,
    materia: nombre,
    categoria,
    level,
    correlativas: prev.length ? prev.join("-") : undefined,
  });
}

const pf = materias.find((x) => x.materia.includes("Proyecto Final"));
if (pf && !pf.correlativas) {
  pf.correlativas = "PPS06-3.4.218";
}

fs.mkdirSync(outPath.replace(/\/[^/]+$/, ""), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(materias, null, 2) + "\n", "utf8");
console.log(`${materias.length} materias -> ${outPath}`);
