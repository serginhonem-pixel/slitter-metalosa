import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import {
  parseStockRows,
  parseOrderRows,
  parseBulkImportWorkbook,
  buildImportTemplateWorkbook,
} from "./parseBulkImport";

describe("parseStockRows", () => {
  it("converts rows with a peso/kg column into stock coils", () => {
    const rows = [{ "Peso (kg)": 10000 }, { "Peso (kg)": 8500.5 }];

    const { coils, skipped } = parseStockRows(rows, 1);

    expect(coils).toEqual([
      { id: 1, weight: 10000 },
      { id: 2, weight: 8500.5 },
    ]);
    expect(skipped).toEqual([]);
  });

  it("skips rows with invalid or zero weight and reports why", () => {
    const rows = [{ "Peso (kg)": 0 }, { "Peso (kg)": "" }, { "Peso (kg)": "abc" }];

    const { coils, skipped } = parseStockRows(rows, 1);

    expect(coils).toEqual([]);
    expect(skipped).toHaveLength(3);
    expect(skipped[0].reason).toMatch(/peso/i);
  });
});

describe("parseOrderRows — modo código", () => {
  const products = [
    { code: "P1", desc: "Perfil 45", width: 45, type: "BQ", thickness: 1.8 },
    { code: "P2", desc: "Perfil 60", width: 60, type: "GALV", thickness: 1.8 },
  ];
  const context = { products, coilType: "BQ", coilThickness: 1.8 };

  it("pulls width and description from the matching catalog product when código is provided", () => {
    const rows = [{ Codigo: "P1", "Peso (kg)": 3000 }];

    const { demands, skipped } = parseOrderRows(rows, context, 1);

    expect(demands).toEqual([
      { id: 1, code: "P1", desc: "Perfil 45", width: 45, targetWeight: 3000 },
    ]);
    expect(skipped).toEqual([]);
  });

  it("skips a row whose código is not found in the catalog", () => {
    const rows = [{ Codigo: "NAOEXISTE", "Peso (kg)": 3000 }];

    const { demands, skipped } = parseOrderRows(rows, context, 1);

    expect(demands).toEqual([]);
    expect(skipped).toHaveLength(1);
    expect(skipped[0].reason).toMatch(/não encontrado/i);
  });

  it("skips a row whose código matches a product with different material/thickness than configured", () => {
    const rows = [{ Codigo: "P2", "Peso (kg)": 3000 }];

    const { demands, skipped } = parseOrderRows(rows, context, 1);

    expect(demands).toEqual([]);
    expect(skipped).toHaveLength(1);
    expect(skipped[0].reason).toMatch(/material|espessura/i);
  });
});

describe("parseOrderRows — modo manual", () => {
  const context = { products: [], coilType: "BQ", coilThickness: 1.8 };

  it("builds a manual demand from largura + peso when no código is given", () => {
    const rows = [{ Largura: 250, "Peso (kg)": 3000, Descricao: "Tampa lateral" }];

    const { demands, skipped } = parseOrderRows(rows, context, 1);

    expect(demands).toEqual([
      { id: 1, code: "MAN", desc: "Tampa lateral", width: 250, targetWeight: 3000 },
    ]);
    expect(skipped).toEqual([]);
  });

  it("builds a qty-mode manual demand when quantidade is filled instead of peso", () => {
    const rows = [{ Largura: 250, Quantidade: 10 }];

    const { demands } = parseOrderRows(rows, context, 1);

    expect(demands).toEqual([
      { id: 1, code: "MAN", desc: "250mm manual", width: 250, targetQty: 10 },
    ]);
  });

  it("skips a row with no código and no valid largura", () => {
    const rows = [{ Largura: "", "Peso (kg)": 3000 }];

    const { demands, skipped } = parseOrderRows(rows, context, 1);

    expect(demands).toEqual([]);
    expect(skipped).toHaveLength(1);
    expect(skipped[0].reason).toMatch(/largura/i);
  });

  it("skips a row with valid largura but neither peso nor quantidade filled", () => {
    const rows = [{ Largura: 250 }];

    const { demands, skipped } = parseOrderRows(rows, context, 1);

    expect(demands).toEqual([]);
    expect(skipped).toHaveLength(1);
    expect(skipped[0].reason).toMatch(/peso|quantidade/i);
  });
});

describe("parseBulkImportWorkbook", () => {
  it("reads Estoque and Pedidos sheets from a workbook and returns combined coils/demands", () => {
    const workbook = XLSX.utils.book_new();
    const estoqueSheet = XLSX.utils.aoa_to_sheet([["Peso (kg)"], [10000]]);
    const pedidosSheet = XLSX.utils.aoa_to_sheet([
      ["Largura", "Peso (kg)", "Descricao"],
      [250, 3000, "Tampa lateral"],
    ]);
    XLSX.utils.book_append_sheet(workbook, estoqueSheet, "Estoque");
    XLSX.utils.book_append_sheet(workbook, pedidosSheet, "Pedidos");

    const result = parseBulkImportWorkbook(workbook, {
      products: [],
      coilType: "BQ",
      coilThickness: 1.8,
    }, 1);

    expect(result.coils).toEqual([{ id: 1, weight: 10000 }]);
    expect(result.demands).toEqual([
      { id: 1, code: "MAN", desc: "Tampa lateral", width: 250, targetWeight: 3000 },
    ]);
    expect(result.skippedStock).toEqual([]);
    expect(result.skippedOrders).toEqual([]);
  });
});

describe("buildImportTemplateWorkbook", () => {
  it("creates a workbook with Estoque and Pedidos sheets with the expected headers", () => {
    const workbook = buildImportTemplateWorkbook();

    expect(workbook.SheetNames).toEqual(["Estoque", "Pedidos"]);

    const estoqueRows = XLSX.utils.sheet_to_json(workbook.Sheets["Estoque"], { header: 1 });
    expect(estoqueRows[0]).toEqual(["Peso (kg)"]);

    const pedidosRows = XLSX.utils.sheet_to_json(workbook.Sheets["Pedidos"], { header: 1 });
    expect(pedidosRows[0]).toEqual(["Codigo", "Largura", "Peso (kg)", "Quantidade", "Descricao"]);
  });
});
