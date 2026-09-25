import { describe, it, expect } from "vitest";
import { calculateSheetOptimization } from "./optimizationEngine";

const SHEET_WIDTH = 2750;
const SHEET_HEIGHT = 1830;

function assertNoOverlapAndInBounds(sheets, sheetWidth, sheetHeight) {
  sheets.forEach((sheet) => {
    sheet.placements.forEach((p, i) => {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.x + p.width).toBeLessThanOrEqual(sheetWidth + 1e-6);
      expect(p.y + p.height).toBeLessThanOrEqual(sheetHeight + 1e-6);

      sheet.placements.forEach((q, j) => {
        if (i === j) return;
        const overlapX = p.x < q.x + q.width - 1e-6 && q.x < p.x + p.width - 1e-6;
        const overlapY = p.y < q.y + q.height - 1e-6 && q.y < p.y + p.height - 1e-6;
        expect(overlapX && overlapY).toBe(false);
      });
    });
  });
}

describe("calculateSheetOptimization — geometry is always valid", () => {
  it("never overlaps placements and never places a piece outside the sheet bounds", () => {
    const { sheetResults } = calculateSheetOptimization({
      sheetWidth: SHEET_WIDTH,
      sheetHeight: SHEET_HEIGHT,
      sheetDemands: [
        { width: 600, height: 400, qty: 8, isFiller: false },
        { width: 900, height: 300, qty: 5, isFiller: false },
      ],
      availableProducts: [],
    });

    assertNoOverlapAndInBounds(sheetResults.sheets, SHEET_WIDTH, SHEET_HEIGHT);
    expect(sheetResults.stats.totalPieces).toBe(13);
  });

  it("marks a piece that doesn't fit in either orientation as oversize instead of placing it", () => {
    const { sheetResults } = calculateSheetOptimization({
      sheetWidth: SHEET_WIDTH,
      sheetHeight: SHEET_HEIGHT,
      sheetDemands: [{ width: 3000, height: 2000, qty: 1, isFiller: false }],
      availableProducts: [],
    });

    expect(sheetResults.oversize).toHaveLength(1);
    expect(sheetResults.sheets).toHaveLength(0);
  });

  it("rotates a piece when that is the only orientation that fits the sheet", () => {
    const { sheetResults } = calculateSheetOptimization({
      sheetWidth: SHEET_WIDTH,
      sheetHeight: SHEET_HEIGHT,
      // 1800x2500 doesn't fit as-is (height 2500 > 1830) but fits rotated (2500x1800)
      sheetDemands: [{ width: 1800, height: 2500, qty: 1, isFiller: false }],
      availableProducts: [],
    });

    const placement = sheetResults.sheets[0].placements[0];
    expect(placement.rotated).toBe(true);
    expect(placement.width).toBe(2500);
    expect(placement.height).toBe(1800);
  });
});

describe("calculateSheetOptimization — avoids unnecessary rotation", () => {
  it("keeps identical pieces unrotated except where rotating fills otherwise-wasted margin", () => {
    // 600x250 tiles a 2750x1830 sheet cleanly in a 4x7 grid (28/sheet) without needing to
    // rotate. The leftover 350mm-wide margin (2750 - 4*600) can't fit another unrotated
    // piece, but a rotated one (250mm wide) does — so a *few* rotations there are a genuine
    // density gain, not noise. What must NOT happen is the old behavior of scattering
    // rotated pieces throughout the main grid for no efficiency benefit.
    const { sheetResults } = calculateSheetOptimization({
      sheetWidth: SHEET_WIDTH,
      sheetHeight: SHEET_HEIGHT,
      sheetDemands: [{ width: 600, height: 250, qty: 50, isFiller: false }],
      availableProducts: [],
    });

    const rotatedCount = sheetResults.sheets.reduce(
      (acc, sheet) => acc + sheet.placements.filter((p) => p.rotated).length,
      0
    );
    const firstSheetCount = sheetResults.sheets[0].placements.length;

    expect(sheetResults.stats.totalPieces).toBe(50);
    // Only the margin-filling pieces should ever rotate (at most one 250mm-wide column).
    expect(rotatedCount).toBeLessThanOrEqual(3);
    // Using the margin means the first sheet holds MORE than the naive 4x7=28 grid,
    // not less — confirming rotation here is a net gain, not wasted motion.
    expect(firstSheetCount).toBeGreaterThan(28);
    assertNoOverlapAndInBounds(sheetResults.sheets, SHEET_WIDTH, SHEET_HEIGHT);
  });

  it("still uses rotation when it is the only way to fit every piece requested", () => {
    // Same case as above, but mixed with a piece that can only be placed rotated —
    // rotation must still happen for that one, without breaking the rest.
    const { sheetResults } = calculateSheetOptimization({
      sheetWidth: SHEET_WIDTH,
      sheetHeight: SHEET_HEIGHT,
      sheetDemands: [
        { width: 600, height: 250, qty: 20, isFiller: false },
        { width: 1800, height: 2500, qty: 1, isFiller: false },
      ],
      availableProducts: [],
    });

    expect(sheetResults.stats.totalPieces).toBe(21);
    assertNoOverlapAndInBounds(sheetResults.sheets, SHEET_WIDTH, SHEET_HEIGHT);
  });
});
