import { calculateBreakdown } from './price-breakdown.mjs?v=20261030';

const form = document.querySelector('#terms-calculator');
const section = document.querySelector('#terms');
const price = form.querySelector('#calc-price');
const discount = form.querySelector('#calc-discount');
const fee = form.querySelector('#calc-fee');
const error = form.querySelector('#calc-error');
const chart = section.querySelector('.price-components');
const currency = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 2, minimumFractionDigits: 0 });
const percentage = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
const money = cents => currency.format(cents / 100);
const percent = value => `${percentage.format(value)}%`;
const set = (key, value) => { section.querySelector(`[data-calc="${key}"]`).textContent = value; };

function updateCalculator() {
  let result;
  try {
    result = calculateBreakdown(price.valueAsNumber, Number(discount.value), Number(fee.value));
  } catch (exception) {
    if (!(exception instanceof RangeError)) throw exception;
    price.setAttribute('aria-invalid', 'true');
    error.hidden = false;
    return;
  }
  price.removeAttribute('aria-invalid');
  error.hidden = true;
  for (const name of ['discount', 'fee', 'hotel', 'guest']) set(name, money(result[`${name}Cents`]));
  set('discount-share', `${percent(result.discountPercent)} тарифа`);
  set('fee-share', `${percent(result.feeSharePercent)} тарифа`);
  set('hotel-share', `${percent(result.hotelSharePercent)} тарифа`);
  set('fee-description', `${percent(result.feePercent)} от цены заказа со скидкой для гостя.`);
  set('full-discount', `${percent(result.fullDiscountPercent)} · ${money(result.fullDiscountCents)}`);
  chart.style.setProperty('--discount-share', `${result.discountPercent}%`);
  chart.style.setProperty('--fee-share', `${result.feeSharePercent}%`);
  chart.style.setProperty('--hotel-share', `${result.hotelSharePercent}%`);
  section.querySelector('.calculator-results').setAttribute('aria-label', `Расчёт для основного тарифа ${money(result.rackCents)} за ночь`);
}
form.addEventListener('input', updateCalculator);
form.addEventListener('change', updateCalculator);
form.addEventListener('submit', event => event.preventDefault());
updateCalculator();
form.hidden = false;
