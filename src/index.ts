// ── Provider ──────────────────────────────────────────────────────────────────
export { HyperElements } from "./react/HyperElements";

// ── Hooks ─────────────────────────────────────────────────────────────────────
export {
  usePaymentSession,
  useElements,
  type UseElementsReturn,
} from "./react/hooks";

// ── Components ────────────────────────────────────────────────────────────────
export { default as PaymentElement } from "./react/PaymentElement";

export { default as CvcWidget } from "./react/CvcWidget";

// ── Payment Method Types & Parsers ────────────────────────────────────────────
export type {
  Card,
  PaymentMethod,
  PaymentMethodKind,
  PaymentMethodData,
  PaymentMethodListData,
} from "./paymentMethodTypes";

export {
  parsePaymentMethod,
  parsePaymentMethodList,
  parseSinglePaymentMethod,
} from "./paymentMethodTypes";

// ── Payment Session Wrapper ───────────────────────────────────────────────────
export type { TypedPaymentSessionHandler } from "./paymentSessionWrapper";
export { wrapPaymentSessionHandler } from "./paymentSessionWrapper";

// ── Types ───────────────────────────────────────────────────────────────────
export type {
  PaymentElementHandle,
  PaymentElementProps,
} from "./react/PaymentElement";

export type { HyperElementsProps } from "./react/HyperElements";

export type { CvcWidgetHandle, CvcWidgetProps } from "./react/CvcWidget";

export type CustomerLastUsedPaymentMethodCard = {
  card_network?: string;
  card_brand?: string;
  scheme?: string;
  last4_digits?: string;
  last4?: string;
  last4Digits?: string;
  card_exp_month?: string;
  card_exp_year?: string;
  [key: string]: unknown;
};

export type CustomerLastUsedPaymentMethod = {
  payment_method?: string;
  payment_method_type?: string;
  card?: CustomerLastUsedPaymentMethodCard;
  error?: unknown;
  [key: string]: unknown;
};

/** Alias for CustomerLastUsedPaymentMethod for cleaner imports */
export type LastUsedPaymentMethod = CustomerLastUsedPaymentMethod;

export type ConfirmPaymentError = {
  type?: "card_error" | "validation_error" | string;
  message?: string;
};

export type ConfirmPaymentResult = {
    error?: ConfirmPaymentError;
    status?: string;
    paymentIntent?: unknown;
};

export type CustomerSavedPaymentMethodsSession = {
  getCustomerLastUsedPaymentMethodData: () => CustomerLastUsedPaymentMethod | null;
  getCustomerDefaultPaymentMethodData?: () => CustomerLastUsedPaymentMethod | null;
  confirmWithLastUsedPaymentMethod: (args: {
    confirmParams: { return_url: string; [key: string]: unknown };
    redirect?: "always" | "if_required";
    id?: string;
  }) => Promise<ConfirmPaymentResult>;
  confirmWithDefaultPaymentMethod?: (args: {
    confirmParams: { return_url: string; [key: string]: unknown };
    redirect?: "always" | "if_required";
    id?: string;
  }) => Promise<ConfirmPaymentResult>;
  [key: string]: unknown;
};

// ── Definitions (copied from capacitor-hyperswitch for standalone usage) ───────
export type {
  CustomConfig,
  HyperConfig,
  SubscriptionEvent,
  Theme,
  Layout,
  Colors,
  ColorType,
  OffsetType,
  ShadowConfig,
  Shapes,
  Font,
  PrimaryButtonColors,
  PrimaryButtonColorType,
  PrimaryButton,
  GooglePayButtonType,
  GooglePayButtonStyle,
  GooglePayThemeBaseStyle,
  GooglePayConfiguration,
  ApplePayButtonType,
  ApplePayButtonStyle,
  ApplePayThemeBaseStyle,
  ApplePayConfiguration,
  Appearance,
  Placeholder,
  Address,
  Phone,
  AddressDetails,
  CustomerConfiguration,
  PaymentSheetOptions,
  CvcAppearance,
  CvcWidgetOptions,
  JSONValue,
  PaymentResult,
  UpdateIntentResult,
  PaymentEventData,
  PaymentSessionHandler,
  Elements,
  InitPaymentSession,
  HyperswitchSession,
  HyperswitchPlugin,
} from "./definitions";
