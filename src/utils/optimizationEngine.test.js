import { describe, it, expect } from "vitest";
import {
  calculateOptimization,
  findBestCombinations,
  generatePatternOptions,
  generateSuggestions,
} from "./optimizationEngine";

describe("calculateOptimization — refilo (trim) must be counted as scrap", () => {
  it("charges the trim's proportional weight as scrap, not just the internal leftover", () => {
    // Bobina mãe 1200mm, refilo 20mm -> útil 1180mm. Peso da bobina: 10.000kg (bruto, com refilo).
    // Um único corte de 1180mm preenche 100% da largura útil (zero sobra interna).
    const { results } = calculateOptimization({
      motherWidth: 1200,
      trim: 20,
      stockCoils: [{ id: 1, weight: 10000 }],
      demands: [{ id: "d1", code: "P1", desc: "Produto 1", width: 1180, targetQty: 1 }],
      availableProducts: [],
      fillerWidths: [],
    });

    const pattern = results.patterns[0];
    expect(pattern.usedWidth).toBe(1180);
    // scrap esperado = (refilo / motherWidth) * pesoBobina = (20/1200) * 10000 ≈ 166.67kg
    expect(pattern.scrapWeight).toBeCloseTo((20 / 1200) * 10000, 1);
    // eficiência não pode ser 100% quando existe refilo real sendo descartado
    expect(Number(results.stats.efficiency)).toBeLessThan(100);
    expect(Number(results.stats.efficiency)).toBeCloseTo(98.33, 1);
  });

  it("reports 0 scrap only when there truly is no trim and no internal waste", () => {
    const { results } = calculateOptimization({
      motherWidth: 1200,
      trim: 0,
      stockCoils: [{ id: 1, weight: 10000 }],
      demands: [{ id: "d1", code: "P1", desc: "Produto 1", width: 1200, targetQty: 1 }],
      availableProducts: [],
      fillerWidths: [],
    });
    const pattern = results.patterns[0];
    expect(pattern.scrapWeight).toBeCloseTo(0, 6);
    expect(Number(results.stats.efficiency)).toBeCloseTo(100, 6);
  });
});

describe("calculateOptimization — demands with the same width stay independent", () => {
  it("does not merge tracking of two different products that share a width", () => {
    const { results } = calculateOptimization({
      motherWidth: 1200,
      trim: 20,
      stockCoils: [{ id: 1, weight: 10000 }, { id: 2, weight: 10000 }],
      demands: [
        { id: "d1", code: "A", desc: "Tampa lateral", width: 250, targetQty: 2 },
        { id: "d2", code: "B", desc: "Suporte", width: 250, targetQty: 3 },
      ],
      availableProducts: [],
      fillerWidths: [],
    });

    const entries = Object.values(results.demandAnalysis);
    expect(entries).toHaveLength(2);

    const tampa = entries.find((d) => d.desc === "Tampa lateral");
    const suporte = entries.find((d) => d.desc === "Suporte");

    expect(tampa.reqQty).toBe(2);
    expect(tampa.producedQty).toBe(2);
    expect(suporte.reqQty).toBe(3);
    expect(suporte.producedQty).toBe(3);
  });
});

describe("calculateOptimization — mixed kg/qty demands", () => {
  it("still produces a weight-mode demand when another demand in the same list uses qty mode", () => {
    const { results } = calculateOptimization({
      motherWidth: 1200,
      trim: 20,
      stockCoils: [{ id: 1, weight: 10000 }, { id: 2, weight: 10000 }, { id: 3, weight: 10000 }],
      demands: [
        { id: "d1", code: "A", desc: "Pedido em KG", width: 300, targetWeight: 3000 },
        { id: "d2", code: "B", desc: "Pedido em QTD", width: 200, targetQty: 2 },
      ],
      availableProducts: [],
      fillerWidths: [],
    });

    const entries = Object.values(results.demandAnalysis);
    const kgDemand = entries.find((d) => d.desc === "Pedido em KG");
    const qtyDemand = entries.find((d) => d.desc === "Pedido em QTD");

    expect(kgDemand.isQtyMode).toBeFalsy();
    expect(kgDemand.producedWeight).toBeGreaterThan(0);
    expect(kgDemand.producedQty).toBeGreaterThan(0);

    expect(qtyDemand.isQtyMode).toBe(true);
    expect(qtyDemand.producedQty).toBe(2);
  });

  it("still produces a weight-mode demand even when it is the only one and no qty demand exists", () => {
    const { results } = calculateOptimization({
      motherWidth: 1200,
      trim: 20,
      stockCoils: [{ id: 1, weight: 10000 }],
      demands: [{ id: "d1", code: "A", desc: "Pedido em KG", width: 300, targetWeight: 3000 }],
      availableProducts: [],
      fillerWidths: [],
    });
    const [kgDemand] = Object.values(results.demandAnalysis);
    expect(kgDemand.producedWeight).toBeGreaterThan(0);
  });
});

describe("calculateOptimization — basic bin packing behavior", () => {
  it("weight-mode demands are constrained by real stock and report a deficit when it runs out", () => {
    // Largura útil 1000mm, só 1 bobina real disponível -> cabem no máx. 2 peças de 400mm nela.
    // O peso alvo pede muito mais do que 1 bobina cobre, então sobra déficit (produzido < alvo).
    const { results } = calculateOptimization({
      motherWidth: 1000,
      trim: 0,
      stockCoils: [{ id: 1, weight: 5000 }],
      demands: [{ id: "d1", code: "A", desc: "Peça 400mm", width: 400, targetWeight: 100000 }],
      availableProducts: [],
      fillerWidths: [],
    });

    const [demand] = Object.values(results.demandAnalysis);
    expect(demand.producedQty).toBeLessThanOrEqual(2); // só cabem 2x400mm em 1000mm de largura útil
    expect(demand.producedWeight).toBeLessThan(demand.reqWeight); // déficit visível
    expect(results.stats.totalCoils).toBe(1); // limitado ao estoque real informado
  });

  it("qty-mode demands generate as many virtual coils as needed, ignoring real stock count (documents current design)", () => {
    // Isso é intencional hoje: modo "quantidade" não é limitado pelas bobinas físicas cadastradas.
    // Este teste documenta o comportamento pra não ser "corrigido" sem decisão consciente.
    const { results } = calculateOptimization({
      motherWidth: 1000,
      trim: 0,
      stockCoils: [{ id: 1, weight: 5000 }], // só 1 bobina real
      demands: [{ id: "d1", code: "A", desc: "Peça 400mm", width: 400, targetQty: 3 }],
      availableProducts: [],
      fillerWidths: [],
    });

    const [demand] = Object.values(results.demandAnalysis);
    expect(demand.producedQty).toBe(3); // as 3 peças saem, mesmo só existindo 1 bobina real em estoque
  });

  it("returns no patterns when there are no demands", () => {
    const { results, suggestions } = calculateOptimization({
      motherWidth: 1200,
      trim: 20,
      stockCoils: [{ id: 1, weight: 10000 }],
      demands: [],
      availableProducts: [],
      fillerWidths: [],
    });
    expect(results.patterns).toHaveLength(0);
    expect(results.stats.totalCoils).toBe(0);
    expect(suggestions).toEqual([]);
  });
});

describe("calculateOptimization — filler widths fill leftover space", () => {
  it("fills the remaining usable width with filler pieces and tracks them separately from demand", () => {
    const { results } = calculateOptimization({
      motherWidth: 1000,
      trim: 0,
      stockCoils: [{ id: 1, weight: 5000 }],
      demands: [{ id: "d1", code: "A", desc: "Peça 600mm", width: 600, targetQty: 1 }],
      availableProducts: [],
      fillerWidths: [{ id: "f1", width: 400, desc: "Filler 400mm" }],
    });

    const pattern = results.patterns[0];
    expect(pattern.usedWidth).toBe(1000); // 600 + 400 preenche tudo
    expect(pattern.scrapWeight).toBeCloseTo(0, 6);
    expect(results.fillerAnalysis["400"].producedQty).toBe(1);
  });
});

describe("findBestCombinations", () => {
  const products = [
    { code: "A", width: 300, history: 1 },
    { code: "B", width: 200, history: 1 },
    { code: "C", width: 150, history: 1 },
  ];

  it("finds combinations that fit within the target width, sorted by least waste", () => {
    const results = findBestCombinations(500, products);
    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => {
      expect(r.totalWidth).toBeLessThanOrEqual(500);
      expect(r.waste).toBeGreaterThanOrEqual(0);
    });
    // a melhor opção deve ter o menor desperdício entre as candidatas
    for (let i = 1; i < results.length; i++) {
      expect(results[i].waste).toBeGreaterThanOrEqual(results[i - 1].waste - 0.001);
    }
  });

  it("returns an empty array when nothing fits", () => {
    const results = findBestCombinations(50, products);
    expect(results).toEqual([]);
  });
});

describe("generatePatternOptions", () => {
  it("only returns combinations that include every mandatory width", () => {
    const widths = [{ width: 300 }, { width: 200 }, { width: 150 }];
    const options = generatePatternOptions(700, widths, 10, [300]);
    expect(options.length).toBeGreaterThan(0);
    options.forEach((opt) => {
      expect(opt.counts["300"]).toBeGreaterThan(0);
      expect(opt.totalWidth).toBeLessThanOrEqual(700);
    });
  });

  it("returns an empty array when usableWidth is zero or there are no widths", () => {
    expect(generatePatternOptions(0, [{ width: 100 }])).toEqual([]);
    expect(generatePatternOptions(500, [])).toEqual([]);
  });
});

describe("generateSuggestions", () => {
  it("prices suggested filler combos using the coil's gross (mother) width, not the usable width", () => {
    // Bobina mãe 1200mm, refilo 20mm -> útil 1180mm. Padrão único usa 1000mm, sobra 180mm.
    const patterns = [
      {
        index: 0,
        count: 1,
        usedWidth: 1000,
        assignedCoils: [{ weight: 10000 }],
      },
    ];
    const availableProducts = [{ code: "F", width: 180, history: 0 }];
    const suggestions = generateSuggestions(patterns, 1180, 1200, 9000, 10000, availableProducts);

    expect(suggestions).toHaveLength(1);
    const [sug] = suggestions[0].suggestions;
    // peso esperado da tira de 180mm = (180/1200) * 10000 = 1500kg (usando largura bruta)
    expect(sug.totalWeightToAdd).toBeCloseTo((180 / 1200) * 10000, 1);
  });
});
