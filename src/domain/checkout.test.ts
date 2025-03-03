import { describe, expect, it } from "vitest";
import { EMPTY_CHECKOUT, isExpiryInFuture, passesLuhn, validateCheckout, type CheckoutForm } from "./checkout";

const NOW = new Date(2026, 9, 15); // 15 Oct 2026

const valid: CheckoutForm = {
  fullName: "Riley Chen",
  email: "riley@clinic.test",
  address: "12 Harbor Street",
  city: "Portland",
  postalCode: "97201",
  cardNumber: "4242 4242 4242 4242",
  expiry: "12/28",
  cvc: "123",
};

describe("passesLuhn", () => {
  it.each(["4242424242424242", "5555555555554444", "378282246310005"])("accepts %s", (card) => {
    expect(passesLuhn(card)).toBe(true);
  });

  it.each(["4242424242424241", "1234567812345678", ""])("rejects %s", (card) => {
    expect(passesLuhn(card)).toBe(false);
  });
});

describe("isExpiryInFuture", () => {
  it("accepts the current month", () => expect(isExpiryInFuture("10/26", NOW)).toBe(true));
  it("rejects last month", () => expect(isExpiryInFuture("09/26", NOW)).toBe(false));
  it("accepts a later year with an earlier month", () => expect(isExpiryInFuture("01/27", NOW)).toBe(true));
  it("rejects malformed input", () => expect(isExpiryInFuture("13/26", NOW)).toBe(false));
});

describe("validateCheckout", () => {
  it("accepts a fully valid form", () => {
    expect(validateCheckout(valid, NOW)).toEqual({});
  });

  it("flags every required field on an empty form", () => {
    expect(Object.keys(validateCheckout(EMPTY_CHECKOUT, NOW)).sort()).toEqual(
      ["address", "cardNumber", "city", "cvc", "email", "expiry", "fullName", "postalCode"].sort(),
    );
  });

  it.each<[Partial<CheckoutForm>, keyof CheckoutForm, string]>([
    [{ email: "riley@clinic" }, "email", "Enter a valid email address."],
    [{ postalCode: "9720" }, "postalCode", "Enter a 5-digit ZIP code."],
    [{ postalCode: "97201-1234" }, "postalCode", ""],
    [{ cardNumber: "4242 4242 4242 4241" }, "cardNumber", "Card number is not valid."],
    [{ cardNumber: "4242" }, "cardNumber", "Card number must be 13 to 19 digits."],
    [{ expiry: "1228" }, "expiry", "Use the format MM/YY."],
    [{ expiry: "09/26" }, "expiry", "This card has expired."],
    [{ cvc: "12" }, "cvc", "Security code must be 3 or 4 digits."],
  ])("%o -> %s", (patch, field, message) => {
    const errors = validateCheckout({ ...valid, ...patch }, NOW);
    if (message === "") expect(errors[field]).toBeUndefined();
    else expect(errors[field]).toBe(message);
  });

  it("ignores surrounding whitespace", () => {
    expect(validateCheckout({ ...valid, email: "  riley@clinic.test ", postalCode: " 97201 " }, NOW)).toEqual({});
  });
});
