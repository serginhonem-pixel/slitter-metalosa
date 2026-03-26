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

export const calculateOptimization = ({ motherWidth, trim, stockCoils, demands, availableProducts }) => {
  const safeMotherWidth = Number(motherWidth);
  const safeTrim = Number(trim) || 0;
  const usableWidth = Math.max(0, safeMotherWidth - safeTrim);

  const totalAvailableWeight = stockCoils.reduce((acc, c) => acc + c.weight, 0);

  let allItems = [];
  const demandAnalysis = {};
  const avgCoilWeight = totalAvailableWeight / stockCoils.length;

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

  allItems.sort((a, b) => b.width - a.width);

  let availableCoils = [...stockCoils].map((c) => ({
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

  const results = {
    patterns: patternsArray,
    demandAnalysis,
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
    foundSuggestions = generateSuggestions(
      patternsArray,
      usableWidth,
      totalUseful,
      totalInputWeight,
      availableProducts
    );
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
