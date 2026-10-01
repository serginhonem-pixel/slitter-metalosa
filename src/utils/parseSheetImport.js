import * as XLSX from "xlsx";

const normalizeHeader = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const normalizeNumber = (value) => {
  if (value == null || value === "") return NaN;
  if (typeof value === "number") return value;
  const raw = String(value).trim();
  if (!raw) return NaN;
  const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
  return Number.parseFloat(normalized);
};

const findValue = (row, labels) => {
  const keys = Object.keys(row);
  const matchKey = keys.find((k) => labels.includes(normalizeHeader(k)));
  return matchKey ? row[matchKey] : "";
};

export const parseSheetPieceRows = (rows, baseId = Date.now()) => {
  const pieces = [];
  const skipped = [];

  rows.forEach((row) => {
    const width = normalizeNumber(findValue(row, ["largura", "width"]));
    const height = normalizeNumber(findValue(row, ["altura", "height"]));
    const qty = normalizeNumber(findValue(row, ["quantidade", "qtd", "qty"]));

    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
      skipped.push({ row, reason: "Largura e altura devem ser números maiores que zero." });
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      skipped.push({ row, reason: "Quantidade inválida ou vazia." });
      return;
    }

    const rawDesc = String(findValue(row, ["descricao", "descricao da peca", "descricao peca"])).trim();
    const desc = rawDesc || `${width}x${height}mm`;

    pieces.push({ id: baseId + pieces.length, width, height, qty, desc });
  });

  return { pieces, skipped };
};

export const buildSheetImportTemplateWorkbook = () => {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([
    ["Largura", "Altura", "Quantidade", "Descricao"],
    [600, 400, 8, "Lateral do movel"],
    [900, 300, 5, ""],
  ]);
  XLSX.utils.book_append_sheet(workbook, sheet, "Pecas");
  return workbook;
};

export const downloadSheetImportTemplate = () => {
  XLSX.writeFile(buildSheetImportTemplateWorkbook(), "modelo-pecas-betini.xlsx");
};

/**
 * Reads a .xlsx/.xls File (browser File API) and parses its first sheet as piece rows.
 * Returns a Promise resolving to { data: { pieces, skipped }, error }.
 */
export const readSheetImportFile = (file) => {
  return new Promise((resolve) => {
    if (!/\.xlsx?$|\.xls$/i.test(file.name)) {
      resolve({ data: null, error: "Formato inválido. Envie um arquivo .xlsx ou .xls." });
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data = new Uint8Array(reader.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
        resolve({ data: parseSheetPieceRows(rows), error: null });
      } catch (err) {
        console.error(err);
        resolve({ data: null, error: "Não foi possível ler o Excel. Verifique o arquivo." });
      }
    };

    reader.onerror = () => {
      resolve({ data: null, error: "Não foi possível ler o arquivo." });
    };

    reader.readAsArrayBuffer(file);
  });
};
