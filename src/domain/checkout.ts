export interface CheckoutForm {
  fullName: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
}

export type CheckoutField = keyof CheckoutForm;
export type CheckoutErrors = Partial<Record<CheckoutField, string>>;

export const EMPTY_CHECKOUT: CheckoutForm = {
  fullName: "",
  email: "",
  address: "",
  city: "",
  postalCode: "",
  cardNumber: "",
  expiry: "",
  cvc: "",
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ZIP = /^\d{5}(-\d{4})?$/;
const EXPIRY = /^(0[1-9]|1[0-2])\/(\d{2})$/;

/** Standard Luhn checksum used by every major card network. */
export function passesLuhn(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return digits.length > 0 && sum % 10 === 0;
}

export function digitsOnly(value: string): string {
  return value.replace(/[\s-]/g, "");
}

/** Returns true when MM/YY is the current month or later. */
export function isExpiryInFuture(expiry: string, now: Date): boolean {
  const match = EXPIRY.exec(expiry.trim());
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  return year > nowYear || (year === nowYear && month >= nowMonth);
}

export function validateCheckout(form: CheckoutForm, now: Date = new Date()): CheckoutErrors {
  const errors: CheckoutErrors = {};

  if (form.fullName.trim().length < 2) errors.fullName = "Enter your full name.";
  if (!EMAIL.test(form.email.trim())) errors.email = "Enter a valid email address.";
  if (form.address.trim().length < 5) errors.address = "Enter a street address.";
  if (form.city.trim() === "") errors.city = "Enter a city.";
  if (!ZIP.test(form.postalCode.trim())) errors.postalCode = "Enter a 5-digit ZIP code.";

  const card = digitsOnly(form.cardNumber);
  if (!/^\d{13,19}$/.test(card)) errors.cardNumber = "Card number must be 13 to 19 digits.";
  else if (!passesLuhn(card)) errors.cardNumber = "Card number is not valid.";

  if (!EXPIRY.test(form.expiry.trim())) errors.expiry = "Use the format MM/YY.";
  else if (!isExpiryInFuture(form.expiry, now)) errors.expiry = "This card has expired.";

  if (!/^\d{3,4}$/.test(form.cvc.trim())) errors.cvc = "Security code must be 3 or 4 digits.";

  return errors;
}

export function hasErrors(errors: CheckoutErrors): boolean {
  return Object.keys(errors).length > 0;
}
