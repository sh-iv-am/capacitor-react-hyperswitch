/**
 * PaymentSessionHandler Wrapper
 *
 * Wraps the raw PaymentSessionHandler from the native plugin and provides
 * typed methods that parse the raw JSON into proper TypeScript objects.
 */

import type { PaymentSessionHandler as RawPaymentSessionHandler } from "./definitions";
import type {
  PaymentMethodData,
  PaymentMethodListData,
} from "./paymentMethodTypes";
import {
  parsePaymentMethodList,
  parseSinglePaymentMethod,
} from "./paymentMethodTypes";
import type { PaymentResult } from "./definitions";

/**
 * Wrapped PaymentSessionHandler that provides typed methods.
 * This maintains the same API as the raw handler but returns properly typed data.
 */
export interface TypedPaymentSessionHandler {
  /** The opaque ID used to route calls to the correct native handler instance. */
  readonly handlerId: string;

  /**
   * All saved payment methods for the customer.
   * Returns properly typed PaymentMethod objects.
   */
  getCustomerSavedPaymentMethodData(): Promise<PaymentMethodListData>;

  /**
   * The customer's default saved payment method.
   * Returns a properly typed PaymentMethod object.
   */
  getCustomerDefaultSavedPaymentMethodData(): Promise<PaymentMethodData>;

  /**
   * The customer's most recently used saved payment method.
   * Returns a properly typed PaymentMethod object.
   */
  getCustomerLastUsedPaymentMethodData(): Promise<PaymentMethodData>;

  /** Confirm with the default saved method (uses mounted CvcWidget if present). */
  confirmWithCustomerDefaultPaymentMethod(): Promise<PaymentResult>;

  /** Confirm with the last-used saved method (uses mounted CvcWidget if present). */
  confirmWithCustomerLastUsedPaymentMethod(): Promise<PaymentResult>;
}

/**
 * Wraps a raw PaymentSessionHandler and adds type parsing to its methods.
 *
 * @param rawHandler - The raw handler from the native plugin
 * @returns A typed wrapper that parses raw JSON into typed objects
 */
export function wrapPaymentSessionHandler(
  rawHandler: RawPaymentSessionHandler
): TypedPaymentSessionHandler {
  return {
    get handlerId(): string {
      return rawHandler.handlerId;
    },

    async getCustomerSavedPaymentMethodData(): Promise<PaymentMethodListData> {
      // Call the raw method which returns JSONValue
      const rawData = await rawHandler.getCustomerSavedPaymentMethodData();
      // Parse and return typed data
      return parsePaymentMethodList(rawData);
    },

    async getCustomerDefaultSavedPaymentMethodData(): Promise<PaymentMethodData> {
      const rawData = await rawHandler.getCustomerDefaultSavedPaymentMethodData();
      return parseSinglePaymentMethod(rawData);
    },

    async getCustomerLastUsedPaymentMethodData(): Promise<PaymentMethodData> {
      const rawData = await rawHandler.getCustomerLastUsedPaymentMethodData();
      return parseSinglePaymentMethod(rawData);
    },

    async confirmWithCustomerDefaultPaymentMethod(): Promise<PaymentResult> {
      return rawHandler.confirmWithCustomerDefaultPaymentMethod();
    },

    async confirmWithCustomerLastUsedPaymentMethod(): Promise<PaymentResult> {
      return rawHandler.confirmWithCustomerLastUsedPaymentMethod();
    },
  };
}
