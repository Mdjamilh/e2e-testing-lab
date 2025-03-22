import type { CheckoutDetails } from "../pages/CheckoutPage";

export interface InvalidCheckoutCase {
  title: string;
  patch: Partial<CheckoutDetails>;
  field: keyof CheckoutDetails;
  message: string;
}

/** One bad field at a time on top of an otherwise valid form. */
export const INVALID_CHECKOUT_CASES: InvalidCheckoutCase[] = [
  { title: "missing name", patch: { fullName: "" }, field: "fullName", message: "Enter your full name." },
  { title: "email without a domain", patch: { email: "riley@" }, field: "email", message: "Enter a valid email address." },
  { title: "four-digit ZIP", patch: { postalCode: "9720" }, field: "postalCode", message: "Enter a 5-digit ZIP code." },
  { title: "card fails Luhn", patch: { cardNumber: "4242 4242 4242 4241" }, field: "cardNumber", message: "Card number is not valid." },
  { title: "card too short", patch: { cardNumber: "4242" }, field: "cardNumber", message: "Card number must be 13 to 19 digits." },
  { title: "expired card", patch: { expiry: "01/20" }, field: "expiry", message: "This card has expired." },
  { title: "expiry without slash", patch: { expiry: "1239" }, field: "expiry", message: "Use the format MM/YY." },
  { title: "two-digit security code", patch: { cvc: "12" }, field: "cvc", message: "Security code must be 3 or 4 digits." },
];

/** Inputs that look unusual but must be accepted. */
export const ACCEPTED_VARIANTS: { title: string; patch: Partial<CheckoutDetails> }[] = [
  { title: "ZIP+4", patch: { postalCode: "97201-1234" } },
  { title: "card without spaces", patch: { cardNumber: "4242424242424242" } },
  { title: "Mastercard test number", patch: { cardNumber: "5555 5555 5555 4444" } },
  { title: "four-digit security code", patch: { cvc: "1234" } },
];
