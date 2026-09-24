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

const findSheet = (workbook, names) => {
  const sheetName = workbook.SheetNames.find((name) => names.includes(normalizeHeader(name)));
  return sheetName ? workbook.Sheets[sheetName] : null;
};

export const parseStockRows = (rows, baseId = Date.now()) => {
  const coils = [];
  const skipped = [];

  rows.forEach((row) => {
    const weight = normalizeNumber(findValue(row, ["peso", "peso kg", "peso (kg)", "weight"]));
    if (!Number.isFinite(weight) || weight <= 0) {
      skipped.push({ row, reason: "Peso inválido ou vazio." });
      return;
    }
    coils.push({ id: baseId + coils.length, weight });
  });

  return { coils, skipped };
};

export const parseOrderRows = (rows, { products = [], coilType = "", coilThickness = 0 }, baseId = Date.now()) => {
  const demands = [];
  const skipped = [];
  const safeType = String(coilType || "").toUpperCase();
  const safeThickness = Number(coilThickness) || 0;

  rows.forEach((row) => {
    const code = String(findValue(row, ["codigo", "cod", "code"])).trim();

    let width;
    let desc;
    let resolvedCode;

    if (code) {
      const product = products.find((p) => p.code.toUpperCase() === code.toUpperCase());
      if (!product) {
        skipped.push({ row, reason: `Código "${code}" não encontrado no catálogo.` });
        return;
      }
      const typeMatch = String(product.type || "").toUpperCase() === safeType;
      const thicknessMatch = Math.abs((Number(product.thickness) || 0) - safeThickness) < 0.05;
      if (!typeMatch || !thicknessMatch) {
        skipped.push({
          row,
          reason: `Código "${code}" é de material/espessura diferente do configurado.`,
        });
        return;
      }
      width = product.width;
      desc = product.desc;
      resolvedCode = product.code;
    } else {
      width = normalizeNumber(findValue(row, ["largura", "width"]));
      if (!Number.isFinite(width) || width <= 0) {
        skipped.push({ row, reason: "Largura inválida ou vazia (e nenhum código informado)." });
        return;
      }
      const rawDesc = String(findValue(row, ["descricao", "descricao produto", "descricao do produto"])).trim();
      desc = rawDesc || `${width}mm manual`;
      resolvedCode = "MAN";
    }

    const weight = normalizeNumber(findValue(row, ["peso", "peso kg", "peso (kg)", "weight"]));
    const qty = normalizeNumber(findValue(row, ["quantidade", "qtd", "qty"]));

    if (Number.isFinite(qty) && qty > 0) {
      demands.push({ id: baseId + demands.length, code: resolvedCode, desc, width, targetQty: qty });
    } else if (Number.isFinite(weight) && weight > 0) {
      demands.push({ id: baseId + demands.length, code: resolvedCode, desc, width, targetWeight: weight });
    } else {
      skipped.push({ row, reason: "Informe peso (kg) ou quantidade para o pedido." });
    }
  });

  return { demands, skipped };
};

export const parseCatalogRows = (rows) => {
  const products = [];
  const skipped = [];

  rows.forEach((row) => {
    const code = String(findValue(row, ["codigo", "cod", "code"])).trim();
    const desc = String(findValue(row, ["descricao", "descricao produto", "descricao do produto"])).trim();
    const type = String(findValue(row, ["tipo", "classe"])).trim();
    const thickness = normalizeNumber(findValue(row, ["espessura", "thickness"]));
    const width = normalizeNumber(findValue(row, ["largura", "width"]));
    const history = normalizeNumber(
      findValue(row, ["historico faturamento", "historico", "historico de faturamento", "hist_faturamento"])
    );

    if (!code || !desc || !Number.isFinite(width) || width <= 0 || !Number.isFinite(thickness)) {
      skipped.push({ row, reason: "Informe código, descrição, espessura e largura válidos." });
      return;
    }

    products.push({ code, desc, type, thickness, width, history: Number.isFinite(history) ? history : 0 });
  });

  return { products, skipped };
};

export const parseBulkImportWorkbook = (workbook, context, baseId = Date.now()) => {
  const catalogoSheet = findSheet(workbook, ["catalogo"]);
  const estoqueSheet = findSheet(workbook, ["estoque"]);
  const pedidosSheet = findSheet(workbook, ["pedidos"]);

  const catalogoRows = catalogoSheet ? XLSX.utils.sheet_to_json(catalogoSheet, { defval: "" }) : [];
  const estoqueRows = estoqueSheet ? XLSX.utils.sheet_to_json(estoqueSheet, { defval: "" }) : [];
  const pedidosRows = pedidosSheet ? XLSX.utils.sheet_to_json(pedidosSheet, { defval: "" }) : [];

  const { products: catalogProducts, skipped: skippedCatalog } = parseCatalogRows(catalogoRows);
  const { coils, skipped: skippedStock } = parseStockRows(estoqueRows, baseId);
  const orderContext = { ...context, products: [...(context.products || []), ...catalogProducts] };
  const { demands, skipped: skippedOrders } = parseOrderRows(pedidosRows, orderContext, baseId);

  return { catalogProducts, coils, demands, skippedCatalog, skippedStock, skippedOrders };
};

export const buildImportTemplateWorkbook = () => {
  const workbook = XLSX.utils.book_new();

  const catalogoSheet = XLSX.utils.aoa_to_sheet([
    ["Codigo", "Descricao", "Tipo", "Espessura", "Largura"],
    ["P1", "Perfil US 45X17X1,80", "BQ", 1.8, 45],
  ]);
  XLSX.utils.book_append_sheet(workbook, catalogoSheet, "Catálogo");

  const estoqueSheet = XLSX.utils.aoa_to_sheet([["Peso (kg)"], [10000], [8500]]);
  XLSX.utils.book_append_sheet(workbook, estoqueSheet, "Estoque");

  const pedidosSheet = XLSX.utils.aoa_to_sheet([
    ["Codigo", "Largura", "Peso (kg)", "Quantidade", "Descricao"],
    ["P1", "", 3000, "", ""],
    ["", 250, "", 10, "Tampa lateral"],
  ]);
  XLSX.utils.book_append_sheet(workbook, pedidosSheet, "Pedidos");

  return workbook;
};

export const downloadImportTemplate = () => {
  XLSX.writeFile(buildImportTemplateWorkbook(), "modelo-importacao-betini.xlsx");
};

/**
 * Reads a .xlsx/.xls File (browser File API) and parses it via parseBulkImportWorkbook.
 * Returns a Promise resolving to { data, error }.
 */
export const readBulkImportFile = (file, context) => {
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
        resolve({ data: parseBulkImportWorkbook(workbook, context), error: null });
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
