# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are PCP (Planejamento e Controle de Produção) staff at Metalosa, a metal
company, planning how to slit mother coils of steel into the widths a production order
needs. Login evidence (`pcp@metalosa.com.br`) and the domain vocabulary (bobina mãe,
refilo, PCP) confirm this. The product is multi-tenant capable (`companyId` scoping in
Firebase, per-company catalog and plan history) even though only Metalosa uses it today.

## Product Purpose

Betini Slitter turns a list of ordered product widths and available mother-coil stock
into a cutting plan: which widths to cut from which coil, how many coils are needed, how
much material becomes scrap, and a production order ready for the factory floor (PDF and
Excel export). It exists to replace manual/spreadsheet cutting-pattern planning with an
optimizer that minimizes scrap and speeds up turning an order list into a shop-floor plan.

## Positioning

Targets the specific mechanics of coil slitting (refilo/trim loss, weight-proportional
strip costing from a physical mother coil, mixed "by weight" and "by quantity" demand
modes, catalog of known product widths per material type/thickness) rather than being a
generic 1D cutting-stock calculator. A neighboring generic tool could not reproduce the
refilo-aware weight accounting or the Betini catalog/plan-history workflow without
rebuilding it.

## Operating Context

- Machine setup per plan: mother coil width, refilo (trim), stock coils on hand (each
  with its own real weight in kg), material type + thickness (used to filter the
  product catalog).
- Demand entry: either from the company's product catalog (by code/width) or manual
  (ad-hoc width + description), and either "by weight" (kg target) or "by quantity"
  (number of child coils) per line item — the two input axes are independent per demand,
  not a single global mode.
- Optional "larguras complementares" (filler widths): generic widths used to soak up
  leftover scrap space on a cutting pattern when no catalog demand fits it.
- Output: cutting patterns (which widths + how many per pattern, sorted by frequency),
  scrap weight and efficiency %, per-demand produced-vs-required tracking, PDF
  "Ordem de Produção" and pattern-variation printouts, Excel export, and a saved plan
  history per company.
- Language: interface and generated documents are Portuguese (pt-BR).

## Capabilities and Constraints

- Stack: React 19 + Vite + Tailwind, Firebase (auth + Firestore for catalog/plans),
  `xlsx` for Excel export. Optimization math lives in `src/utils/optimizationEngine.js`
  as pure functions, now covered by a Vitest suite (`npm test`).
- Coil weight entered by the user is **gross weight, refilo included** (weighed as the
  coil arrives) — confirmed 2026-09-24. The cutting-weight math prorates every strip's
  weight against the mother coil's full width (`motherWidth`), not the usable width
  after trim, so the refilo's mass is counted as real scrap. This was a real bug found
  and fixed in this session (previously the trim's weight was silently excluded from
  scrap/efficiency); do not revert to prorating against usable width without a new,
  explicit confirmation that the input weight convention changed.
- Cutting-pattern generation uses a best-fit bin-packing heuristic plus a bounded
  combinatorial search for scrap-filling suggestions — a good practical approximation,
  not a proven-optimal cutting-stock solver. The UI does not currently tell the user how
  far a plan is from the theoretical optimum.
- "Quantity mode" demands (targetQty) are deliberately NOT constrained by the real stock
  coils on hand — the engine generates as many virtual coils as needed. "Weight mode"
  demands (targetWeight) ARE constrained by the real stock entered. This asymmetry is
  intentional current behavior, documented in the test suite, but is not surfaced to the
  user in the UI — worth revisiting for `clarify`/`onboard` work later.
- Both goals — minimizing scrap and speed of turning an order list into a production
  order — matter equally; neither should be sacrificed for the other in future work.

## Brand Commitments

Product name: **Betini Slitter**, part of the Betini Studio portfolio (alongside Betini
Lean, Maintenance, Logística, etc.). Visual identity already implemented this session
from the Betini Studio brand book: tokens `ink #201e1d`, `paper #f3f2f2`,
`paper-2 #eae9e9`, `accent #ec3013`, `accent-700 #ae1800`; Archivo typeface; editorial
layout grammar (1px dividers instead of card shadows); accent red anchors the official symbol, header rule and numbered workflow steps,
while functional accents identify primary actions and genuine warnings; official Betini logo/
favicon SVGs copied into `src/assets/betini/` and `public/favicon.svg`. Voice: short,
direct, no hype/exclamation/emoji, matching the rest of the Betini Studio portfolio.

## Evidence on Hand

No customer testimonials, case studies, or benchmark numbers exist for this product yet
— do not fabricate any. Real operating evidence: the live Firestore catalog and plan
history for Metalosa (not sample/demo data), and `RESUMO-ALTERACOES.md` documenting a
prior round of calculation fixes to this same engine.

## Product Principles

1. Scrap-weight and efficiency numbers must be physically honest (refilo counted as
   real material loss) — the tool feeds real production and cost decisions, not just a
   nice-looking dashboard.
2. Minimizing scrap and speed-to-production-order are equally important; don't trade one
   for the other without the user's say-so.
3. Multi-tenant from day one technically (company-scoped data), even while only Metalosa
   uses it in practice — future work should not assume single-tenant shortcuts.
4. Portuguese-first: all user-facing copy, generated PDFs, and Excel exports stay pt-BR.
5. The optimizer is a heuristic, not a proven-optimal solver — don't imply more certainty
   than the algorithm actually delivers.

## Accessibility & Inclusion

No product-specific requirement established yet; standard web accessibility practice
applies by default (not yet audited).
