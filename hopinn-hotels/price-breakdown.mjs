const DISCOUNTS = [30, 40, 50];
const FEES = [13, 14, 15];
const percentOf = (cents, percent) => Number((BigInt(cents) * BigInt(percent) + 50n) / 100n);
const twoDecimals = value => Math.round(value * 100) / 100;

/** All money is in integer kopecks; the service fee is inside the guest price. */
export function calculateBreakdown(price, discount, fee) {
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
    throw new RangeError('Введите положительную цену номера.');
  }
  const rackCents = Math.round(price * 100);
  if (!Number.isSafeInteger(rackCents) || rackCents < 1 || Number(price.toFixed(2)) !== price) {
    throw new RangeError('Цена должна быть указана с точностью до копеек.');
  }
  if (!DISCOUNTS.includes(discount) || !FEES.includes(fee)) {
    throw new RangeError('Выберите скидку и сервисный сбор из доступных вариантов.');
  }
  const discountCents = percentOf(rackCents, discount);
  const guestCents = rackCents - discountCents;
  const feeCents = percentOf(guestCents, fee);
  const hotelCents = guestCents - feeCents;
  const feeSharePercent = twoDecimals((100 - discount) * fee / 100);
  const fullDiscountPercent = twoDecimals(discount + feeSharePercent);
  return {
    rackCents, discountCents, guestCents, feeCents, hotelCents,
    fullDiscountCents: discountCents + feeCents,
    discountPercent: discount, feePercent: fee, feeSharePercent,
    hotelSharePercent: twoDecimals(100 - fullDiscountPercent), fullDiscountPercent,
  };
}
