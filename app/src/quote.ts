/**
 * Розрахунок кошторису для проєкту автоматизації.
 * Усі суми — у центах (цілі числа), щоб уникнути похибок float.
 *
 * Це навчальний модуль-ціль для промптів з `prompts/`.
 * Він НАВМИСНЕ недосконалий — саме це ви і знайдете добре сформульованим
 * промптом з acceptance criteria (Task A).
 */

export interface QuoteInput {
  /** Оцінка робіт у годинах */
  hours: number;
  /** Ставка за годину, у центах (напр. 5000 = $50.00) */
  rateCents: number;
  /** Знижка у відсотках, 0..100 */
  discountPercent?: number;
}

/** Ціна проєкту в центах з урахуванням знижки. */
export function estimateTotalCents(input: QuoteInput): number {
  const { hours, rateCents, discountPercent = 0 } = input;
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    throw new RangeError(`discountPercent має бути в межах 0..100, отримано ${discountPercent}`);
  }
  const gross = hours * rateCents;
  const discount = (gross * discountPercent) / 100;
  return Math.round(gross - discount);
}

/**
 * Розбити суму на `parts` платежів (у центах).
 *
 * Платежі рівні з точністю до однієї копійки: остача від ділення
 * розподіляється по перших платежах, тому **сума масиву завжди дорівнює
 * `totalCents`** — гроші не зникають і не створюються.
 *
 * @throws {RangeError} якщо `parts` не ціле число ≥ 1 або `totalCents` не ціле.
 */
export function splitInstallments(totalCents: number, parts: number): number[] {
  if (!Number.isInteger(parts) || parts < 1) {
    throw new RangeError(`parts має бути цілим числом ≥ 1, отримано ${parts}`);
  }
  if (!Number.isInteger(totalCents)) {
    throw new RangeError(`totalCents має бути цілим числом центів, отримано ${totalCents}`);
  }

  const base = Math.trunc(totalCents / parts);
  const remainder = totalCents - base * parts;
  const step = Math.sign(remainder); // знак остачі збігається зі знаком суми
  const extra = Math.abs(remainder); // завжди < parts, тож індекс не вийде за межі

  // Перші `extra` платежів відрізняються на одну копійку в напрямку знаку суми
  // (для від'ємних сум це на копійку менше) — так остача не зникає.
  return Array.from({ length: parts }, (_, i) => (i < extra ? base + step : base));
}

/** Форматування центів у рядок на кшталт "$1,234.50". */
export function formatMoney(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100).toLocaleString("en-US");
  const frac = String(abs % 100).padStart(2, "0");
  return `${sign}$${whole}.${frac}`;
}
