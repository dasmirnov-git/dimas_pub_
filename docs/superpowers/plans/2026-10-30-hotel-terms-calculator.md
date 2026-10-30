# Hotel Terms Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add the approved live price calculator to the existing hotel terms slide and publish it on GitHub Pages.

**Architecture:** A pure cents-based pricing module supplies a small DOM controller. Screen-only CSS consumes ratio variables; print continues to use static markup and proportions. No dependencies or server.

**Tech Stack:** HTML, CSS, ES modules, Node native tests; existing Chrome PDF exporter and CUA browser QA.

**Spec:** docs/superpowers/specs/2026-10-30-hotel-terms-calculator-design.md (approved by Dmitry in chat).

## Global Constraints

- Price defaults to 10 000 ₽; discount 30/40/50%, default 40%; fee 13/14/15%, default 15%.
- Fee is included in the discounted guest price. Full hotel discount excludes the separate 0.1% agency payment.
- Results in rubles and shares; chart proportions update immediately. Invalid price leaves the previous valid chart with a visible explanation.
- Calculator and amounts are screen-only. Print proportions remain 40/9/51 after any input changes.
- Caption is «Основной тариф (Rack rate)» in web and PDF. Last slide remains 13%; preserve noindex and current GitHub audience.
- Use the existing task-specific checkout on a feature branch. User approved implementation and publication; do not ask for another workflow approval.

## Review Focus

- Empty, zero, negative and non-finite price must never render NaN; reject prices beyond safe cents and fractions smaller than a kopeck.
- Kopeck rounding must conserve the total across every discount/fee pair.
- Thin fee sectors must not overlap amount labels on mobile.
- Browser changes must not leak into print labels, proportions or PDF.
- No-JS view must show valid default amounts and no inert calculator controls.

### Task 1: Price calculation

**Files:** Create `hopinn-hotels/price-breakdown.mjs`, `tests/price-breakdown.test.mjs`.

**Interfaces:** `calculateBreakdown(price: number, discount: number, fee: number)` returns rackCents, discountCents, guestCents, feeCents, hotelCents, fullDiscountCents, discountPercent, feePercent, feeSharePercent, hotelSharePercent and fullDiscountPercent. Invalid input throws RangeError.

- [x] Write Node tests for the default values 1000000/400000/600000/90000/510000 cents, fullDiscount 490000 cents and 49%; the nine expected full discounts 39.1/39.8/40.5, 47.8/48.4/49, 56.5/57/57.5; price 20000 with 30/13; kopeck totals; invalid input and unsupported options.
- [x] Run `node --test tests/price-breakdown.test.mjs`; expect missing-module failure.
- [x] Implement integer-cent arithmetic and shares in the pure module.
- [x] Run the test command; expect all tests passing. Commit this unit.

### Task 2: UI, print and publication

**Files:** Create `hopinn-hotels/terms-calculator.mjs`; modify index.html, styles.css, print.css only if required, and the PDF.

**Interfaces:** Consume calculateBreakdown from Task 1; update chart CSS variables and explicit result targets, preserve printed text.

- [x] Confirm the current slide has no controls; this is the missing behavior before implementation.
- [x] Add labelled input/selects above the chart and default amounts. Show price-for-guest and full-discount summary. Use the existing Onest/purple/gold style; keep hints concise.
- [x] Bind input/change/submit events; validate price, update amounts and aria label, clear error after correction. Hide controls when JS is absent.
- [x] Add screen-only ratio rules and results. Keep printed default labels and chart geometry; add Rack rate in shared caption. Version changed CSS/JS/PDF URLs.
- [x] Verify all 9 combinations via core tests and exercise UI at 1280/745/390 px, including empty price and recovery. Check no-JS default view, keyboard labels/focus and absence of overlap.
- [x] Export print after changing inputs as well as default state; rendered PDF should be independent of the active inputs. Compare 8 pages to baseline: only page 5 may differ for Rack rate.
- [x] Run full tests, JS syntax and diff checks. Commit; obtain one fresh whole-branch review; address material findings with regression tests.
## Publication after the whole-branch review

Publish reviewed commits to existing GitHub main branch; verify Pages success, live calculator, noindex, updated PDF and save screenshot.
