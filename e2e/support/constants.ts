/** Saved browser state (localStorage session) written by auth.setup.ts. */
export const AUTH_FILE = "e2e/.auth/user.json";

export const DEMO_USER = { email: "nurse@clinic.test", password: "supplies123", name: "Riley Chen" } as const;

/** A card number that passes the Luhn check, like Stripe's test card. */
export const TEST_CARD = "4242 4242 4242 4242";

export const VALID_CUSTOMER = {
  fullName: "Riley Chen",
  email: "riley@clinic.test",
  address: "12 Harbor Street",
  city: "Portland",
  postalCode: "97201",
  cardNumber: TEST_CARD,
  expiry: "12/39",
  cvc: "123",
} as const;
