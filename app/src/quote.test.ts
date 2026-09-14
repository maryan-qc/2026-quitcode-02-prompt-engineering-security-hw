import { describe, expect, it } from "vitest";
import { estimateTotalCents, formatMoney, splitInstallments } from "./quote.js";

// Базові (happy path) тести. Навмисно неповні — розширення покриття
// це і є ваш перший промпт з cookbook (Task A).

describe("estimateTotalCents", () => {
  it("рахує суму без знижки", () => {
    expect(estimateTotalCents({ hours: 10, rateCents: 5000 })).toBe(50000);
  });

  it("застосовує знижку", () => {
    expect(estimateTotalCents({ hours: 10, rateCents: 5000, discountPercent: 10 })).toBe(45000);
  });

  it("нульові години дають нульовий кошторис", () => {
    expect(estimateTotalCents({ hours: 0, rateCents: 5000 })).toBe(0);
  });

  it("знижка 0% нічого не змінює", () => {
    expect(estimateTotalCents({ hours: 10, rateCents: 5000, discountPercent: 0 })).toBe(50000);
  });

  it("знижка 100% обнуляє кошторис", () => {
    expect(estimateTotalCents({ hours: 10, rateCents: 5000, discountPercent: 100 })).toBe(0);
  });

  it("округлює дробовий результат знижки до цілих центів", () => {
    // gross = 333, discount = 33.3 → 299.7 → 300
    expect(estimateTotalCents({ hours: 1, rateCents: 333, discountPercent: 10 })).toBe(300);
  });

  it("повертає ціле число центів навіть за дробових вхідних", () => {
    expect(Number.isInteger(estimateTotalCents({ hours: 2.5, rateCents: 3333 }))).toBe(true);
  });

  it("відхиляє знижку поза діапазоном 0..100", () => {
    expect(() => estimateTotalCents({ hours: 10, rateCents: 5000, discountPercent: 150 })).toThrow();
  });
});

describe("splitInstallments", () => {
  it("ділить суму, що ділиться націло", () => {
    expect(splitInstallments(90000, 3)).toEqual([30000, 30000, 30000]);
  });

  it("сума частин дорівнює вихідній сумі, коли ділення з остачею", () => {
    // 10000 / 3 = 3333.33… — решта копійок не має зникати
    const parts = splitInstallments(10000, 3);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(10000);
  });

  it("не завищує суму, коли округлення йде вгору", () => {
    // 20000 / 3 = 6666.67 — наївне округлення дало б 20001
    const parts = splitInstallments(20000, 3);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(20000);
  });

  it("повертає рівно `parts` елементів", () => {
    expect(splitInstallments(10000, 7)).toHaveLength(7);
  });

  it("один платіж дорівнює всій сумі", () => {
    expect(splitInstallments(12345, 1)).toEqual([12345]);
  });

  it("розподіляє остачу по перших платежах, а не ховає її", () => {
    expect(splitInstallments(10000, 3)).toEqual([3334, 3333, 3333]);
  });

  it("працює з від'ємною сумою (повернення коштів)", () => {
    const parts = splitInstallments(-10000, 3);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(-10000);
  });

  it("відхиляє нульову кількість частин замість тихого порожнього масиву", () => {
    expect(() => splitInstallments(10000, 0)).toThrow();
  });

  it("відхиляє дробову кількість частин", () => {
    expect(() => splitInstallments(10000, 2.5)).toThrow(RangeError);
  });

  it("не втрачає копійку, коли сума менша за кількість частин", () => {
    expect(splitInstallments(1, 3)).toEqual([1, 0, 0]);
  });
});

describe("formatMoney", () => {
  it("форматує центи", () => {
    expect(formatMoney(123450)).toBe("$1,234.50");
  });

  it("форматує нуль", () => {
    expect(formatMoney(0)).toBe("$0.00");
  });

  it("ставить мінус перед знаком валюти", () => {
    expect(formatMoney(-1234)).toBe("-$12.34");
  });

  it("доповнює центи нулем зліва", () => {
    expect(formatMoney(5)).toBe("$0.05");
  });

  it("ставить роздільники тисяч у великих сумах", () => {
    expect(formatMoney(123456789)).toBe("$1,234,567.89");
  });
});
