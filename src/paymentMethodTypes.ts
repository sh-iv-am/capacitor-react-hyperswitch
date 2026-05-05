/**
 * Payment Method Type definitions
 * Raw JSON from native SDK is parsed into these typed structures
 */

/** Card details for a saved payment method */
export interface Card {
  /** Card scheme (e.g., "Mastercard", "Visa") */
  scheme: string;
  /** Last 4 digits of the card number */
  last4_digits: string;
  /** Card holder name */
  card_holder_name: string;
  /** Card network (e.g., "Mastercard", "Visa") */
  card_network: string;
  /** Card type (e.g., "CREDIT", "DEBIT") */
  card_type: string;
  /** Expiry year (2 digits, e.g., "29") */
  expiry_year: string;
  /** Issuer country */
  issuer_country: string;
  /** Expiry month (2 digits, e.g., "02") */
  expiry_month: string;
  /** Card fingerprint for identification */
  card_fingerprint: string | null;
  /** Card issuer name */
  card_issuer: string;
  /** Whether card is saved to locker */
  saved_to_locker: boolean;
  /** Card token (if available) */
  card_token: string | null;
  /** Nickname for the card */
  nick_name: string;
  /** Card ISIN (first 6 digits) */
  card_isin: string;
}

/** Payment method types supported by the SDK */
export type PaymentMethodKind =
  | "card"
  | "wallet"
  | "card_redirect"
  | "pay_later"
  | "bank_redirect"
  | "open_banking"
  | "bank_debit"
  | "bank_transfer"
  | "crypto"
  | "reward"
  | "gift_card"
  | string;

/** Complete payment method object returned from the SDK */
export interface PaymentMethod {
  /** The type of payment method (e.g., "credit", "debit") */
  payment_method_type: string;
  /** Additional metadata (JSON string or null) */
  metadata: string | null;
  /** Whether this is the customer's default payment method */
  default_payment_method_set: boolean;
  /** ISO timestamp when the method was created */
  created: string;
  /** Unique token for this payment method */
  payment_token: string;
  /** Issuer code (if available) */
  payment_method_issuer_code: string | null;
  /** Surcharge details (JSON string or null) */
  surcharge_details: string | null;
  /** Billing information (JSON string containing address, phone, email) */
  billing: string | null;
  /** The issuer name (e.g., "MASTERCARD INTERNATIONAL") */
  payment_method_issuer: string;
  /** ISO timestamp when the method was last used */
  last_used_at: string;
  /** Unique payment method ID */
  payment_method_id: string;
  /** Bank details (JSON string or null) */
  bank: string | null;
  /** Whether installment payments are enabled */
  installment_payment_enabled: boolean;
  /** Whether CVV is required for this method */
  requires_cvv: boolean;
  /** Customer ID associated with this method */
  customer_id: string;
  /** Available payment experiences (e.g., ["NONE"]) */
  payment_experience: string[];
  /** The payment method kind (e.g., "card") */
  payment_method: PaymentMethodKind;
  /** Card details (if this is a card payment method) */
  card: Card | null;
  /** Whether recurring payments are enabled */
  recurring_enabled: boolean;
}

/** Response wrapper for payment method data */
export interface PaymentMethodData {
  /** The payment method data (null if not found or error) */
  data: PaymentMethod | null;
  /** Error message (if an error occurred) */
  error?: string;
}

/** Response wrapper for list of payment methods */
export interface PaymentMethodListData {
  /** Array of payment methods (empty array if none or error) */
  data: PaymentMethod[];
  /** Error message (if an error occurred) */
  error?: string;
}

/**
 * Safely parses a JSON string, returning null if parsing fails
 */
function safeJsonParse(jsonString: string | null | undefined): unknown | null {
  if (!jsonString || typeof jsonString !== "string") {
    return null;
  }
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}

/**
 * Parses raw card data from the SDK into a typed Card object
 */
function parseCard(raw: Record<string, unknown>): Card {
  return {
    scheme: String(raw.scheme ?? ""),
    last4_digits: String(raw.last4_digits ?? ""),
    card_holder_name: String(raw.card_holder_name ?? ""),
    card_network: String(raw.card_network ?? ""),
    card_type: String(raw.card_type ?? ""),
    expiry_year: String(raw.expiry_year ?? ""),
    issuer_country: String(raw.issuer_country ?? ""),
    expiry_month: String(raw.expiry_month ?? ""),
    card_fingerprint: raw.card_fingerprint != null ? String(raw.card_fingerprint) : null,
    card_issuer: String(raw.card_issuer ?? ""),
    saved_to_locker: Boolean(raw.saved_to_locker ?? false),
    card_token: raw.card_token != null ? String(raw.card_token) : null,
    nick_name: String(raw.nick_name ?? ""),
    card_isin: String(raw.card_isin ?? ""),
  };
}

/**
 * Parses raw payment method data from the SDK into a typed PaymentMethod object
 */
export function parsePaymentMethod(raw: Record<string, unknown>): PaymentMethod {
  const cardData = raw.card as Record<string, unknown> | null;

  return {
    payment_method_type: String(raw.payment_method_type ?? ""),
    metadata: raw.metadata != null ? String(raw.metadata) : null,
    default_payment_method_set: Boolean(raw.default_payment_method_set ?? false),
    created: String(raw.created ?? ""),
    payment_token: String(raw.payment_token ?? ""),
    payment_method_issuer_code: raw.payment_method_issuer_code != null
      ? String(raw.payment_method_issuer_code)
      : null,
    surcharge_details: raw.surcharge_details != null
      ? String(raw.surcharge_details)
      : null,
    billing: raw.billing != null ? String(raw.billing) : null,
    payment_method_issuer: String(raw.payment_method_issuer ?? ""),
    last_used_at: String(raw.last_used_at ?? ""),
    payment_method_id: String(raw.payment_method_id ?? ""),
    bank: raw.bank != null ? String(raw.bank) : null,
    installment_payment_enabled: Boolean(raw.installment_payment_enabled ?? false),
    requires_cvv: Boolean(raw.requires_cvv ?? false),
    customer_id: String(raw.customer_id ?? ""),
    payment_experience: Array.isArray(raw.payment_experience)
      ? raw.payment_experience.map(String)
      : [],
    payment_method: String(raw.payment_method ?? "") as PaymentMethodKind,
    card: cardData != null ? parseCard(cardData) : null,
    recurring_enabled: Boolean(raw.recurring_enabled ?? false),
  };
}

/**
 * Parses the raw response from getCustomerSavedPaymentMethodData
 * Returns a list of payment methods with proper typing
 */
export function parsePaymentMethodList(response: unknown): PaymentMethodListData {
  if (response == null) {
    return { data: [], error: "No response from SDK" };
  }

  if (typeof response !== "object") {
    return { data: [], error: "Invalid response type" };
  }

  const responseObj = response as Record<string, unknown>;

  // Check for error in response
  if (responseObj.error != null) {
    return {
      data: [],
      error: String(responseObj.error),
    };
  }

  const rawData = responseObj.data;

  if (!Array.isArray(rawData)) {
    return { data: [], error: "Invalid data format: expected array" };
  }

  const paymentMethods: PaymentMethod[] = [];

  for (const item of rawData) {
    if (item != null && typeof item === "object") {
      try {
        paymentMethods.push(parsePaymentMethod(item as Record<string, unknown>));
      } catch (e) {
        // Log but don't fail the entire list for one bad item
        console.warn("[Hyperswitch] Failed to parse payment method:", e);
      }
    }
  }

  return { data: paymentMethods };
}

/**
 * Parses the raw response from getCustomerDefaultSavedPaymentMethodData
 * or getCustomerLastUsedPaymentMethodData
 * Returns a single payment method with proper typing
 */
export function parseSinglePaymentMethod(response: unknown): PaymentMethodData {
  if (response == null) {
    return { data: null, error: "No response from SDK" };
  }

  if (typeof response !== "object") {
    return { data: null, error: "Invalid response type" };
  }

  const responseObj = response as Record<string, unknown>;

  // Check for error in response
  if (responseObj.error != null) {
    return {
      data: null,
      error: String(responseObj.error),
    };
  }

  const rawData = responseObj.data;

  if (rawData == null) {
    return { data: null };
  }

  if (typeof rawData !== "object") {
    return { data: null, error: "Invalid data format: expected object" };
  }

  try {
    return {
      data: parsePaymentMethod(rawData as Record<string, unknown>),
    };
  } catch (e) {
    return {
      data: null,
      error: `Failed to parse payment method: ${e}`,
    };
  }
}
