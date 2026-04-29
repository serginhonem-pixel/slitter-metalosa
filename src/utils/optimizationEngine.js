// DP sem limite de itens — maximiza o uso do espaço restante
const fillSpaceDP = (capacity, fillerProducts) => {
  if (!fillerProducts.length || capacity <= 0) return [];
  const dp = new Array(capacity + 1).fill(-1);
  const choice = new Array(capacity + 1).fill(null);
  dp[0] = 0;
  for (let w = 1; w <= capacity; w++) {
    for (const p of fillerProducts) {
      if (p.width <= w && dp[w - p.width] >= 0) {
        const val = dp[w - p.width] + p.width;
        if (val > dp[w]) {
          dp[w] = val;
          choice[w] = p;
        }
      }
    }
  }
  // Encontra o melhor aproveitamento <= capacity
  let best = 0;
  for (let w = capacity; w >= 0; w--) {
    if (dp[w] >= 0) { best = w; break; }
  }
  const items = [];
  let w = best;
  while (w > 0 && choice[w]) {
    items.push(choice[w]);
    w -= choice[w].width;
  }
  return items;
};

const getStripWeight = (width, mWidth, mWeight) => {
  if (!mWidth || !mWeight) return 0;
  const safeWidth = Number(mWidth) || 0;
  const safeWeight = Number(mWeight) || 0;
  if (safeWidth <= 0 || safeWeight === 0) return 0;
  return (width / safeWidth) * safeWeight;
};

export const findBestCombinations = (targetWidth, products) => {
  let candidates = [];
  const sortedProducts = [...products].sort((a, b) => b.width - a.width);
  const maxComboSize = 4;
  const maxCandidates = 1500;

  const search = (currentCombo, currentWidth, startIndex) => {
    if (currentCombo.length > 0) {
      candidates.push({
        combo: [...currentCombo],
        totalWidth: currentWidth,
        waste: targetWidth - currentWidth,
      });
    }
    if (currentCombo.length >= maxComboSize) return;

    for (let i = startIndex; i < sortedProducts.length; i++) {
      const p = sortedProducts[i];
      if (currentWidth + p.width <= targetWidth) {
        currentCombo.push(p);
        search(currentCombo, currentWidth + p.width, i);
        currentCombo.pop();
        if (candidates.length > maxCandidates) return;
      }
    }
  };

  search([], 0, 0);

  candidates.sort((a, b) => {
    if (Math.abs(a.waste - b.waste) > 0.1) return a.waste - b.waste;
    const histA = a.combo.reduce((acc, i) => acc + i.history, 0);
    const histB = b.combo.reduce((acc, i) => acc + i.history, 0);
    return histB - histA;
  });

  const uniqueResults = [];
  const seenSignatures = new Set();

  for (const res of candidates) {
    const signature = res.combo.map((c) => c.code).sort().join("+");
    if (!seenSignatures.has(signature)) {
      seenSignatures.add(signature);
      uniqueResults.push(res);
    }
    if (uniqueResults.length >= 5) break;
  }

  return uniqueResults;
};

// Gera variações de padrão de corte variando quantidades de cada largura disponível
export const generatePatternOptions = (usableWidth, allWidths, maxOptions = 10, mandatoryWidths = []) => {
  if (!allWidths.length || usableWidth <= 0) return [];

  const sorted = [...allWidths].sort((a, b) => b.width - a.width);
  const candidates = [];
  const seen = new Set();

  const search = (combo, totalWidth, startIdx) => {
    if (combo.length > 0) {
      const key = [...combo].sort((a, b) => a - b).join(',');
      if (!seen.has(key)) {
        seen.add(key);
        const counts = {};
        combo.forEach((w) => { counts[w] = (counts[w] || 0) + 1; });
        // Só aceita se todas as larguras de demanda obrigatórias estiverem presentes
        const hasAllMandatory = mandatoryWidths.every((mw) => counts[mw] > 0);
        if (hasAllMandatory) {
          candidates.push({
            totalWidth,
            waste: usableWidth - totalWidth,
            efficiency: ((totalWidth / usableWidth) * 100).toFixed(1),
            counts,
          });
        }
      }
    }
    if (candidates.length > 2000) return;
    for (let i = startIdx; i < sorted.length; i++) {
      const p = sorted[i];
      if (totalWidth + p.width <= usableWidth) {
        combo.push(p.width);
        search(combo, totalWidth + p.width, i);
        combo.pop();
      }
    }
  };

  search([], 0, 0);

  candidates.sort((a, b) => a.waste - b.waste);

  // Retorna variações diversas: evita mostrar combinações quase iguais
  const result = [];
  const usedTotals = new Set();
  for (const c of candidates) {
    if (!usedTotals.has(c.totalWidth)) {
      usedTotals.add(c.totalWidth);
      result.push(c);
    }
    if (result.length >= maxOptions) break;
  }
  return result;
};

export const generateSuggestions = (
  patterns,
  usableWidth,
  currentTotalUsefulWeight,
  currentTotalInputWeight,
  availableProducts
) => {
  const potentialSuggestions = [];

  patterns.forEach((pattern) => {
    const waste = usableWidth - pattern.usedWidth;

    if (!availableProducts.length) return;

    const minProductWidth = Math.min(...availableProducts.map((p) => p.width));

    if (waste >= minProductWidth) {
      const combinations = findBestCombinations(waste, availableProducts);

      if (combinations.length > 0) {
        const smartSuggestions = combinations.map((combData) => {
          const comboWeightToAdd = combData.combo.reduce((acc, item) => {
            return (
              acc +
              pattern.assignedCoils.reduce((cAcc, coil) => {
                return cAcc + getStripWeight(item.width, usableWidth, coil.weight);
              }, 0)
            );
          }, 0);

          const projectedEfficiency =
            ((currentTotalUsefulWeight + comboWeightToAdd) / currentTotalInputWeight) * 100;

          const itemsWithWeights = combData.combo.map((item) => ({
            ...item,
            weightToAdd: pattern.assignedCoils.reduce((cAcc, coil) => {
              return cAcc + getStripWeight(item.width, usableWidth, coil.weight);
            }, 0),
          }));

          return {
            items: itemsWithWeights,
            totalWidth: combData.totalWidth,
            remainingWaste: waste - combData.totalWidth,
            projectedEfficiency,
            totalWeightToAdd: comboWeightToAdd,
          };
        });

        potentialSuggestions.push({
          patternIndex: pattern.index,
          waste,
          patternCount: pattern.count,
          suggestions: smartSuggestions,
        });
      }
    }
  });

  return potentialSuggestions;
};

export const calculateOptimization = ({ motherWidth, trim, stockCoils, demands, availableProducts, fillerWidths = [] }) => {
  const safeMotherWidth = Number(motherWidth);
  const safeTrim = Number(trim) || 0;
  const usableWidth = Math.max(0, safeMotherWidth - safeTrim);

  const isQtyMode = demands.some((d) => d.targetQty != null);

  let allItems = [];
  const demandAnalysis = {};

  if (isQtyMode) {
    demands.forEach((d) => {
      const qty = Number(d.targetQty) || 0;
      demandAnalysis[d.width] = {
        reqQty: qty,
        producedQty: 0,
        producedWeight: 0,
        desc: d.desc,
        isQtyMode: true,
      };
      for (let i = 0; i < qty; i++) {
        allItems.push({ width: d.width, desc: d.desc, code: d.code });
      }
    });
  } else {
    const totalAvailableWeight = stockCoils.reduce((acc, c) => acc + c.weight, 0);
    const avgCoilWeight = totalAvailableWeight / (stockCoils.length || 1);
    demands.forEach((d) => {
      const estimatedStripWeight = getStripWeight(d.width, usableWidth, avgCoilWeight);
      const safeStripWeight = estimatedStripWeight > 0 ? estimatedStripWeight : 1;
      const qtyNeeded = Math.ceil(d.targetWeight / safeStripWeight);
      demandAnalysis[d.width] = {
        reqWeight: d.targetWeight,
        producedQty: 0,
        producedWeight: 0,
        desc: d.desc,
      };
      for (let i = 0; i < qtyNeeded; i++) {
        allItems.push({ width: d.width, desc: d.desc, code: d.code });
      }
    });
  }

  allItems.sort((a, b) => b.width - a.width);

  const avgStockWeight =
    stockCoils.length > 0
      ? stockCoils.reduce((a, c) => a + c.weight, 0) / stockCoils.length
      : 10000;

  // Em modo qtd geramos bobinas virtuais suficientes; em modo kg usamos o estoque real
  const coilPool = isQtyMode
    ? Array.from({ length: allItems.length }, (_, i) => ({ id: `v-${i}`, weight: avgStockWeight }))
    : [...stockCoils];

  let availableCoils = coilPool.map((c) => ({
    ...c,
    items: [],
    currentWidth: 0,
  }));
  allItems.forEach((item) => {
    let bestCoilIndex = -1;
    let minSpaceLeft = usableWidth + 1;

    for (let i = 0; i < availableCoils.length; i++) {
      const spaceLeft = usableWidth - availableCoils[i].currentWidth;
      if (spaceLeft >= item.width) {
        const potentialSpaceLeft = spaceLeft - item.width;
        if (potentialSpaceLeft < minSpaceLeft) {
          minSpaceLeft = potentialSpaceLeft;
          bestCoilIndex = i;
        }
      }
    }

    if (bestCoilIndex !== -1) {
      availableCoils[bestCoilIndex].items.push(item);
      availableCoils[bestCoilIndex].currentWidth += item.width;
    }
    // Se não couber em nenhuma bobina do estoque, ignora (aparece como déficit na demanda)
  });

  // Preencher sobras com larguras complementares (fillerWidths)
  const fillerAnalysis = {};
  if (fillerWidths.length > 0) {
    const fillerProducts = fillerWidths.map((fw) => ({
      width: fw.width,
      desc: fw.desc || `${fw.width}mm`,
      code: `F-${fw.width}`,
      history: 0,
    }));
    fillerWidths.forEach((fw) => {
      fillerAnalysis[fw.width] = { desc: fw.desc || `${fw.width}mm`, producedQty: 0, producedWeight: 0 };
    });

    availableCoils.forEach((coil) => {
      const remaining = usableWidth - coil.currentWidth;
      if (remaining <= 0) return;
      // DP sem limite de itens — encontra a melhor combinação para preencher a sobra
      const fillerItems = fillSpaceDP(remaining, fillerProducts);
      fillerItems.forEach((fItem) => {
        coil.items.push({ width: fItem.width, desc: fItem.desc, code: fItem.code, isFiller: true });
        coil.currentWidth += fItem.width;
        if (fillerAnalysis[fItem.width]) fillerAnalysis[fItem.width].producedQty++;
      });
    });
  }

  const allUsedCoils = availableCoils.filter((c) => c.items.length > 0);

  const patternsMap = {};
  allUsedCoils.forEach((coil, index) => {
    const sortedItems = [...coil.items].sort((a, b) => b.width - a.width);
    const key = JSON.stringify(sortedItems.map((i) => i.width));

    sortedItems.forEach((item) => {
      const realStripWeight = getStripWeight(item.width, usableWidth, coil.weight);
      if (demandAnalysis[item.width]) {
        demandAnalysis[item.width].producedQty++;
        demandAnalysis[item.width].producedWeight += realStripWeight;
      }
    });

    if (patternsMap[key]) {
      patternsMap[key].count++;
      patternsMap[key].assignedCoils.push(coil);
    } else {
      const usedWidth = sortedItems.reduce((a, b) => a + b.width, 0);
      let currentPos = 0;
      const setupCoordinates = sortedItems.map((item) => {
        const start = currentPos;
        currentPos += item.width;
        return { start, end: currentPos, width: item.width, desc: item.desc };
      });

      patternsMap[key] = {
        cuts: sortedItems,
        setupCoordinates,
        count: 1,
        assignedCoils: [coil],
        usedWidth,
        index,
      };
    }
  });

  const patternsArray = Object.values(patternsMap).sort((a, b) => b.count - a.count);

  let totalInputWeight = 0;
  let totalScrapWeight = 0;

  patternsArray.forEach((p) => {
    const patternInputWeight = p.assignedCoils.reduce((acc, c) => acc + c.weight, 0);
    const patternUsefulWeight = p.assignedCoils.reduce((acc, c) => {
      return acc + getStripWeight(p.usedWidth, usableWidth, c.weight);
    }, 0);

    p.scrapWeight = patternInputWeight - patternUsefulWeight;
    totalInputWeight += patternInputWeight;
    totalScrapWeight += p.scrapWeight;
  });

  const efficiency =
    totalInputWeight > 0
      ? ((totalInputWeight - totalScrapWeight) / totalInputWeight) * 100
      : 0;

  // Calcular peso produzido por filler (usando peso médio das bobinas usadas)
  if (fillerWidths.length > 0) {
    allUsedCoils.forEach((coil) => {
      coil.items.forEach((item) => {
        if (item.isFiller && fillerAnalysis[item.width]) {
          fillerAnalysis[item.width].producedWeight += getStripWeight(item.width, usableWidth, coil.weight);
        }
      });
    });
  }

  // Gera variações de padrão quando há larguras complementares definidas
  let patternOptions = null;
  if (fillerWidths.length > 0) {
    const allWidthsForOptions = [
      ...demands.map((d) => ({ width: d.width, desc: d.desc, code: d.code })),
      ...fillerWidths.map((fw) => ({ width: fw.width, desc: fw.desc || `${fw.width}mm`, code: `F-${fw.width}` })),
    ];
    const mandatoryWidths = demands.map((d) => d.width);
    patternOptions = generatePatternOptions(usableWidth, allWidthsForOptions, 10, mandatoryWidths);
  }

  const results = {
    patterns: patternsArray,
    demandAnalysis,
    fillerAnalysis: Object.keys(fillerAnalysis).length > 0 ? fillerAnalysis : null,
    patternOptions,
    stats: {
      totalCoils: allUsedCoils.length,
      totalInputWeight,
      efficiency: efficiency.toFixed(2),
      totalScrapWeight: totalScrapWeight.toFixed(1),
    },
  };

  let foundSuggestions = [];
  if (efficiency < 97 || patternsArray.some((p) => usableWidth - p.usedWidth > 50)) {
    const totalUseful = totalInputWeight - totalScrapWeight;
    // Se o usuário definiu larguras complementares, usar elas nas sugestões; senão, usar catálogo
    const suggestionPool =
      fillerWidths.length > 0
        ? fillerWidths.map((fw) => ({ width: fw.width, desc: fw.desc || `${fw.width}mm`, code: `F-${fw.width}`, history: 0 }))
        : availableProducts;
    if (suggestionPool.length > 0) {
      foundSuggestions = generateSuggestions(
        patternsArray,
        usableWidth,
        totalUseful,
        totalInputWeight,
        suggestionPool
      );
    }
  }

  return { results, suggestions: foundSuggestions };
};

export const calculateSheetOptimization = ({ sheetWidth, sheetHeight, sheetDemands, availableProducts }) => {
  const safeSheetWidth = Number(sheetWidth);
  const safeSheetHeight = Number(sheetHeight);
  const sheetAreaLocal = safeSheetWidth * safeSheetHeight;

  const primaryPieces = [];
  const fillerPieces = [];
  sheetDemands.forEach((item) => {
    const qty = Math.max(1, Number(item.qty) || 1);
    const isFiller = Boolean(item.isFiller);
    for (let i = 0; i < qty; i++) {
      const piece = {
        width: item.width,
        height: item.height,
        label: `${item.width}x${item.height}mm`,
        isFiller,
      };
      if (isFiller) {
        fillerPieces.push(piece);
      } else {
        primaryPieces.push(piece);
      }
    }
  });

  primaryPieces.sort((a, b) => b.width * b.height - a.width * a.height);
  fillerPieces.sort((a, b) => b.width * b.height - a.width * a.height);

  const sheets = [];
  const oversize = [];
  const unplacedFillers = [];

  const createSheet = () => ({
    id: sheets.length + 1,
    placements: [],
    usedArea: 0,
    freeRects: [{ x: 0, y: 0, width: safeSheetWidth, height: safeSheetHeight }],
  });

  const cleanupFreeRects = (freeRects) => {
    const filtered = freeRects.filter((r) => r.width > 0 && r.height > 0);
    return filtered.filter((rect, idx) => {
      for (let i = 0; i < filtered.length; i++) {
        if (i === idx) continue;
        const other = filtered[i];
        const contained =
          rect.x >= other.x &&
          rect.y >= other.y &&
          rect.x + rect.width <= other.x + other.width &&
          rect.y + rect.height <= other.y + other.height;
        if (contained) return false;
      }
      return true;
    });
  };

  const mergeFreeRects = (freeRects) => {
    let merged = freeRects.slice();
    let didMerge = true;

    while (didMerge) {
      didMerge = false;
      outer: for (let i = 0; i < merged.length; i++) {
        for (let j = i + 1; j < merged.length; j++) {
          const a = merged[i];
          const b = merged[j];
          const sameRow = a.y === b.y && a.height === b.height;
          const sameCol = a.x === b.x && a.width === b.width;

          if (sameRow && a.x + a.width === b.x) {
            merged[i] = { x: a.x, y: a.y, width: a.width + b.width, height: a.height };
            merged.splice(j, 1);
            didMerge = true;
            break outer;
          }
          if (sameRow && b.x + b.width === a.x) {
            merged[i] = { x: b.x, y: a.y, width: a.width + b.width, height: a.height };
            merged.splice(j, 1);
            didMerge = true;
            break outer;
          }
          if (sameCol && a.y + a.height === b.y) {
            merged[i] = { x: a.x, y: a.y, width: a.width, height: a.height + b.height };
            merged.splice(j, 1);
            didMerge = true;
            break outer;
          }
          if (sameCol && b.y + b.height === a.y) {
            merged[i] = { x: a.x, y: b.y, width: a.width, height: a.height + b.height };
            merged.splice(j, 1);
            didMerge = true;
            break outer;
          }
        }
      }
    }

    return merged;
  };

  const findBestPlacement = (piece, targetSheets) => {
    let best = null;
    const orientations = [{ w: piece.width, h: piece.height, rotated: false }];
    if (piece.width !== piece.height) {
      orientations.push({ w: piece.height, h: piece.width, rotated: true });
    }

    targetSheets.forEach((sheet, sheetIdx) => {
      sheet.freeRects.forEach((rect, rectIdx) => {
        orientations.forEach((opt) => {
          if (opt.w > rect.width || opt.h > rect.height) return;
          const areaWaste = rect.width * rect.height - opt.w * opt.h;
          const shortSide = Math.min(rect.width - opt.w, rect.height - opt.h);
          const score = areaWaste * 1000 + shortSide;
          if (!best || score < best.score) {
            best = {
              sheetIdx,
              rectIdx,
              x: rect.x,
              y: rect.y,
              width: opt.w,
              height: opt.h,
              rotated: opt.rotated,
              score,
            };
          }
        });
      });
    });

    return best;
  };

  const placePiece = (sheet, placement, piece) => {
    const rect = sheet.freeRects[placement.rectIdx];
    sheet.freeRects.splice(placement.rectIdx, 1);
    const remainingRight = rect.width - placement.width;
    const remainingBottom = rect.height - placement.height;

    const splitOptionA = [];
    if (remainingRight > 0) {
      splitOptionA.push({ x: rect.x + placement.width, y: rect.y, width: remainingRight, height: rect.height });
    }
    if (remainingBottom > 0) {
      splitOptionA.push({ x: rect.x, y: rect.y + placement.height, width: placement.width, height: remainingBottom });
    }

    const splitOptionB = [];
    if (remainingRight > 0) {
      splitOptionB.push({ x: rect.x + placement.width, y: rect.y, width: remainingRight, height: placement.height });
    }
    if (remainingBottom > 0) {
      splitOptionB.push({ x: rect.x, y: rect.y + placement.height, width: rect.width, height: remainingBottom });
    }

    const scoreSplit = (splits) => splits.reduce((acc, r) => acc + Math.min(r.width, r.height), 0);
    const chosenSplits =
      scoreSplit(splitOptionA) >= scoreSplit(splitOptionB) ? splitOptionA : splitOptionB;

    sheet.freeRects.push(...chosenSplits);
    sheet.freeRects = mergeFreeRects(cleanupFreeRects(sheet.freeRects));

    sheet.placements.push({
      x: placement.x,
      y: placement.y,
      width: placement.width,
      height: placement.height,
      rotated: placement.rotated,
      label: piece.label,
    });
    sheet.usedArea += placement.width * placement.height;
  };

  const placePieces = (pieceList, allowNewSheets) => {
    pieceList.forEach((piece) => {
      const fits =
        (piece.width <= safeSheetWidth && piece.height <= safeSheetHeight) ||
        (piece.height <= safeSheetWidth && piece.width <= safeSheetHeight);
      if (!fits) {
        oversize.push(piece);
        return;
      }

      if (!sheets.length) {
        if (allowNewSheets) {
          sheets.push(createSheet());
        } else {
          unplacedFillers.push(piece);
          return;
        }
      }

      let placement = findBestPlacement(piece, sheets);
      if (!placement && allowNewSheets) {
        sheets.push(createSheet());
        placement = findBestPlacement(piece, sheets);
      }

      if (!placement) {
        if (allowNewSheets) {
          oversize.push(piece);
        } else {
          unplacedFillers.push(piece);
        }
        return;
      }

      placePiece(sheets[placement.sheetIdx], placement, piece);
    });
  };

  placePieces(primaryPieces, true);
  placePieces(fillerPieces, false);

  const totalUsedArea = sheets.reduce((acc, sheet) => acc + sheet.usedArea, 0);
  const totalSheetArea = sheets.length * sheetAreaLocal;
  const efficiency = totalSheetArea ? (totalUsedArea / totalSheetArea) * 100 : 0;
  const placedPieces = sheets.reduce((acc, sheet) => acc + sheet.placements.length, 0);

  const sheetResults = {
    sheets,
    oversize,
    stats: {
      totalPieces: placedPieces,
      totalSheets: sheets.length,
      efficiency: Number(efficiency.toFixed(1)),
      waste: Number((100 - efficiency).toFixed(1)),
    },
  };

  // Generate sheet suggestions
  const heightOptionsRaw = sheetDemands
    .map((item) => Number(item.height))
    .filter((value) => Number.isFinite(value) && value > 0);
  const heightOptions = heightOptionsRaw.length > 0 ? heightOptionsRaw : [600, 900, 1200, 750];
  const widthOptions = Array.from(
    new Map(
      availableProducts
        .map((p) => ({ width: Number(p.width), code: String(p.code ?? "").trim() }))
        .filter((p) => Number.isFinite(p.width) && p.width > 0)
        .map((p) => [p.width, p.code || `SKU-${p.width}`])
    ).entries()
  )
    .map(([width, code]) => ({ width, code }))
    .filter((item) => item.width <= safeSheetWidth);

  const suggestions = [];
  const MIN_FILL_RATIO = 0.7;

  sheets.forEach((sheet, idx) => {
    const freeArea = sheet.freeRects.reduce((acc, rect) => acc + rect.width * rect.height, 0);
    if (freeArea <= 0) return;

    const simulatePlacement = (freeRects, items) => {
      const rects = freeRects.map((r) => ({ ...r }));
      const placedCounts = items.map(() => 0);
      let filledArea = 0;

      const cleanupRects = (list) => {
        const filtered = list.filter((r) => r.width > 0 && r.height > 0);
        return filtered.filter((rect, idx) => {
          for (let i = 0; i < filtered.length; i++) {
            if (i === idx) continue;
            const other = filtered[i];
            const contained =
              rect.x >= other.x &&
              rect.y >= other.y &&
              rect.x + rect.width <= other.x + other.width &&
              rect.y + rect.height <= other.y + other.height;
            if (contained) return false;
          }
          return true;
        });
      };

      const mergeRects = (list) => {
        let merged = list.slice();
        let didMerge = true;
        while (didMerge) {
          didMerge = false;
          outer: for (let i = 0; i < merged.length; i++) {
            for (let j = i + 1; j < merged.length; j++) {
              const a = merged[i];
              const b = merged[j];
              const sameRow = a.y === b.y && a.height === b.height;
              const sameCol = a.x === b.x && a.width === b.width;

              if (sameRow && a.x + a.width === b.x) {
                merged[i] = { x: a.x, y: a.y, width: a.width + b.width, height: a.height };
                merged.splice(j, 1);
                didMerge = true;
                break outer;
              }
              if (sameRow && b.x + b.width === a.x) {
                merged[i] = { x: b.x, y: a.y, width: a.width + b.width, height: a.height };
                merged.splice(j, 1);
                didMerge = true;
                break outer;
              }
              if (sameCol && a.y + a.height === b.y) {
                merged[i] = { x: a.x, y: a.y, width: a.width, height: a.height + b.height };
                merged.splice(j, 1);
                didMerge = true;
                break outer;
              }
              if (sameCol && b.y + b.height === a.y) {
                merged[i] = { x: a.x, y: b.y, width: a.width, height: a.height + b.height };
                merged.splice(j, 1);
                didMerge = true;
                break outer;
              }
            }
          }
        }
        return merged;
      };

      const findBestPlacementInRects = (piece) => {
        let best = null;
        const orientations = [{ w: piece.width, h: piece.height, rotated: false }];
        if (piece.width !== piece.height) {
          orientations.push({ w: piece.height, h: piece.width, rotated: true });
        }

        rects.forEach((rect, rectIdx) => {
          orientations.forEach((opt) => {
            if (opt.w > rect.width || opt.h > rect.height) return;
            const areaWaste = rect.width * rect.height - opt.w * opt.h;
            const shortSide = Math.min(rect.width - opt.w, rect.height - opt.h);
            const score = areaWaste * 1000 + shortSide;
            if (!best || score < best.score) {
              best = { rectIdx, x: rect.x, y: rect.y, width: opt.w, height: opt.h, score };
            }
          });
        });

        return best;
      };

      const placeInRects = (placement) => {
        const rect = rects[placement.rectIdx];
        rects.splice(placement.rectIdx, 1);
        const remainingRight = rect.width - placement.width;
        const remainingBottom = rect.height - placement.height;

        const splitA = [];
        if (remainingRight > 0) {
          splitA.push({ x: rect.x + placement.width, y: rect.y, width: remainingRight, height: rect.height });
        }
        if (remainingBottom > 0) {
          splitA.push({ x: rect.x, y: rect.y + placement.height, width: placement.width, height: remainingBottom });
        }

        const splitB = [];
        if (remainingRight > 0) {
          splitB.push({ x: rect.x + placement.width, y: rect.y, width: remainingRight, height: placement.height });
        }
        if (remainingBottom > 0) {
          splitB.push({ x: rect.x, y: rect.y + placement.height, width: rect.width, height: remainingBottom });
        }

        const scoreSplit = (splits) => splits.reduce((acc, r) => acc + Math.min(r.width, r.height), 0);
        const chosen = scoreSplit(splitA) >= scoreSplit(splitB) ? splitA : splitB;

        rects.push(...chosen);
        const cleaned = cleanupRects(rects);
        rects.length = 0;
        rects.push(...mergeRects(cleaned));
      };

      items.forEach((item, itemIdx) => {
        const qty = Math.max(0, Number(item.qty) || 0);
        for (let i = 0; i < qty; i++) {
          const placement = findBestPlacementInRects(item);
          if (!placement) break;
          placeInRects(placement);
          placedCounts[itemIdx] += 1;
          filledArea += placement.width * placement.height;
        }
      });

      return { filledArea, placedCounts };
    };

    const sheetLabel = String.fromCharCode(65 + idx);
    const candidates = [];

    widthOptions.forEach((wOpt) => {
      heightOptions.forEach((h) => {
        if (h > safeSheetHeight) return;
        const area = wOpt.width * h;
        if (!area) return;

        const qty = sheet.freeRects.reduce((acc, rect) => {
          const fitX = Math.floor(rect.width / wOpt.width);
          const fitY = Math.floor(rect.height / h);
          return acc + fitX * fitY;
        }, 0);

        if (!qty) return;

        const filledArea = area * qty;
        const fillRatio = filledArea / freeArea;
        const score = (1 - fillRatio) * 1000 + (freeArea - filledArea);

        candidates.push({ width: wOpt.width, height: h, code: wOpt.code, qty, area, fillRatio, score, sheetLabel });
      });
    });

    const singles = candidates
      .slice()
      .sort((a, b) => b.fillRatio - a.fillRatio || a.score - b.score)
      .slice(0, 3)
      .map((item) => {
        const items = [{ width: item.width, height: item.height, code: item.code, qty: Math.min(item.qty, 8) }];
        const sim = simulatePlacement(sheet.freeRects, items);
        if (!sim.filledArea) return null;
        return {
          items: [{ ...items[0], qty: sim.placedCounts[0] }],
          fillRatio: sim.filledArea / freeArea,
          sheetLabel,
        };
      })
      .filter(Boolean);

    const combos = [];
    const topCandidates = candidates
      .slice()
      .sort((a, b) => b.fillRatio - a.fillRatio || a.score - b.score)
      .slice(0, 8);

    for (let i = 0; i < topCandidates.length; i++) {
      for (let j = i + 1; j < topCandidates.length; j++) {
        const a = topCandidates[i];
        const b = topCandidates[j];
        const maxA = Math.min(a.qty, 6);
        const maxB = Math.min(b.qty, 6);
        let bestCombo = null;

        for (let qa = 1; qa <= maxA; qa++) {
          for (let qb = 1; qb <= maxB; qb++) {
            const items = [
              { width: a.width, height: a.height, code: a.code, qty: qa },
              { width: b.width, height: b.height, code: b.code, qty: qb },
            ];
            const sim = simulatePlacement(sheet.freeRects, items);
            if (!sim.filledArea) continue;
            const fillRatio = sim.filledArea / freeArea;
            const score = (1 - fillRatio) * 1000 + (freeArea - sim.filledArea);
            if (!bestCombo || score < bestCombo.score) {
              bestCombo = {
                items: [
                  { ...items[0], qty: sim.placedCounts[0] },
                  { ...items[1], qty: sim.placedCounts[1] },
                ],
                fillRatio,
                score,
                sheetLabel,
              };
            }
          }
        }

        if (bestCombo) combos.push(bestCombo);
      }
    }

    combos
      .sort((a, b) => b.fillRatio - a.fillRatio || a.score - b.score)
      .filter((combo) => combo.fillRatio >= MIN_FILL_RATIO)
      .slice(0, 4)
      .forEach((combo) => suggestions.push(combo));

    singles
      .filter((single) => single.fillRatio >= MIN_FILL_RATIO)
      .forEach((single) => suggestions.push(single));
  });

  return { sheetResults, sheetSuggestions: suggestions };
};
