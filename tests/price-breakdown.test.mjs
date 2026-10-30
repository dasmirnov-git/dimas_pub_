import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBreakdown } from '../hopinn-hotels/price-breakdown.mjs';

test('default price splits into 4000 discount, 900 fee, 5100 hotel', () => {
  assert.deepEqual(calculateBreakdown(10000, 40, 15), {
    rackCents: 1000000, discountCents: 400000, guestCents: 600000,
    feeCents: 90000, hotelCents: 510000, fullDiscountCents: 490000,
    discountPercent: 40, feePercent: 15, feeSharePercent: 9,
    hotelSharePercent: 51, fullDiscountPercent: 49,
  });
});

const matrix = [[39.1, 39.8, 40.5], [47.8, 48.4, 49], [56.5, 57, 57.5]];
for (const [i, discount] of [30, 40, 50].entries()) {
  for (const [j, fee] of [13, 14, 15].entries()) {
    test(`${discount}% discount / ${fee}% fee follows the canonical matrix`, () => {
      const r = calculateBreakdown(10000, discount, fee);
      assert.equal(r.fullDiscountPercent, matrix[i][j]);
      assert.equal(r.discountCents + r.feeCents + r.hotelCents, r.rackCents);
      assert.equal(r.guestCents, r.feeCents + r.hotelCents);
      assert.equal(r.fullDiscountCents, r.discountCents + r.feeCents);
      assert.equal(r.discountPercent + r.feeSharePercent + r.hotelSharePercent, 100);
    });
  }
}

test('custom nightly price changes all amounts without adding the fee on top', () => {
  const r = calculateBreakdown(20000, 30, 13);
  assert.deepEqual([r.discountCents, r.guestCents, r.feeCents, r.hotelCents], [600000, 1400000, 182000, 1218000]);
  assert.equal(r.fullDiscountPercent, 39.1);
});

test('kopeck rounding conserves money across all 9 combinations', () => {
  for (const price of [0.01, 1, 99.99, 9999.99, 10000.01, 20000.25, 1000000000.99]) {
    for (const d of [30, 40, 50]) for (const k of [13, 14, 15]) {
      const r = calculateBreakdown(price, d, k);
      assert.equal(r.rackCents, Math.round(price * 100));
      assert.equal(r.discountCents + r.feeCents + r.hotelCents, r.rackCents);
      for (const amount of [r.discountCents, r.feeCents, r.hotelCents]) {
        assert.ok(Number.isSafeInteger(amount) && amount >= 0);
      }
    }
  }
  assert.equal(calculateBreakdown(0.05, 30, 13).discountCents, 2);
});

test('invalid nightly prices and unsupported rates are rejected', () => {
  for (const price of [0, -1, NaN, Infinity, -Infinity, '', '10000', null, undefined, Number.MAX_VALUE, 0.001, 1.005]) {
    assert.throws(() => calculateBreakdown(price, 40, 15), RangeError);
  }
  for (const discount of [0, 20, 35, 100, '40', NaN]) assert.throws(() => calculateBreakdown(10000, discount, 15), RangeError);
  for (const fee of [0, 10, 16, '15', NaN]) assert.throws(() => calculateBreakdown(10000, 40, fee), RangeError);
});
