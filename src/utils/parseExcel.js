import * as XLSX from "xlsx";

const normalizeHeader = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[̀-ͯ]/g, "");

const normalizeNumber = (value) => {
  if (value == null || value === "") return NaN;
  if (typeof value === "number") return value;
  const raw = String(value).trim();
  if (!raw) return NaN;
  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw;
  return Number.parseFloat(normalized);
};

/**
 * Parse an Excel file (.xlsx/.xls) into an array of product objects.
 * Returns a Promise that resolves to { data, error }.
 */
export const parseExcelFile = (file) => {
  return new Promise((resolve) => {
    if (!/\.xlsx?$|\.xls$/i.test(file.name)) {
      resolve({ data: null, error: "Formato invalido. Envie um arquivo .xlsx ou .xls." });
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data = new Uint8Array(reader.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        const mapRow = (row) => {
          const keys = Object.keys(row);
          const findValue = (labels) => {
            const matchKey = keys.find((k) => labels.includes(normalizeHeader(k)));
            return matchKey ? row[matchKey] : "";
          };

          const code = String(findValue(["codigo", "cod", "code"])).trim();
          const desc = String(
            findValue(["descricao", "descricao produto", "descri??o", "descricao do produto"])
          ).trim();
          const type = String(findValue(["tipo", "classe"])).trim();
          const thickness = normalizeNumber(findValue(["espessura", "thickness"]));
          const width = normalizeNumber(findValue(["largura", "width"]));
          const history = normalizeNumber(
            findValue([
              "historico faturamento",
              "historico",
              "historico de faturamento",
              "hist_faturamento",
            ])
          );

          return {
            code,
            desc,
            type,
            thickness,
            width,
            history: Number.isNaN(history) ? 0 : history,
          };
        };

        const parsed = rows
          .map(mapRow)
          .filter(
            (row) =>
              row.code &&
              row.desc &&
              !Number.isNaN(row.width) &&
              !Number.isNaN(row.thickness)
          );

        if (!parsed.length) {
          resolve({ data: null, error: "Nenhuma linha valida encontrada. Verifique as colunas." });
          return;
        }

        resolve({ data: parsed, error: null });
      } catch (err) {
        console.error(err);
        resolve({ data: null, error: "Nao foi possivel ler o Excel. Verifique o arquivo." });
      }
    };

    reader.onerror = () => {
      resolve({ data: null, error: "Nao foi possivel ler o arquivo." });
    };

    reader.readAsArrayBuffer(file);
  });
};

export const downloadTemplate = () => {
  const headers = ["Codigo", "Descricao", "Tipo", "Espessura", "Largura", "Historico Faturamento"];
  const example = [["00650A", "PERFIL US 45X17X1,80", "BQ", 1.8, 65, 3236.75]];

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...example]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Produtos");
  XLSX.writeFile(workbook, "modelo-smartslit.xlsx");
};
