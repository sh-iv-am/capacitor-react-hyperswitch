import { useCallback, useRef, useState } from "react";
import type { Elements, JSONValue, PaymentResult, UpdateIntentResult } from "../definitions";
import { useHyperElementsContext } from "./HyperElements";
import type { PaymentElementHandle } from "./PaymentElement";

/**
 * Returns the `Elements` session from the nearest `<HyperElements>` ancestor.
 *
 * - Returns `null` while the session is still loading.
 * - Throws if called outside of `<HyperElements>`.
 */
export function usePaymentSession(): Elements | null {
  const { elements } = useHyperElementsContext();
  return elements;
}

// ── Elements Hook ─────────────────────────────────────────────────────────────

export interface ElementsActions {
  /** Confirm payment using a PaymentElement ref */
  confirmPayment: (
    paymentElementRef: React.RefObject<PaymentElementHandle | null>,
    options?: { confirmParams?: JSONValue }
  ) => Promise<PaymentResult>;
  /** Update the payment intent with a new authorization */
  updateIntent: (intentResolver: () => Promise<string>) => Promise<UpdateIntentResult>;
}

export interface UseElementsReturn extends ElementsActions {
  /** The raw Elements session (null if not loaded) */
  elements: Elements | null;
}

/**
 * Hook for accessing Elements with confirmPayment and updateIntent methods.
 *
 * @example
 * ```tsx
 * function Checkout() {
 *   const element = useElements();
 *   const paymentRef = useRef<PaymentElementHandle>(null);
 *
 *   const handlePay = async () => {
 *     const result = await element.confirmPayment(paymentRef);
 *     // handle result
 *   };
 *
 *   const handleAmountChange = async (newAmount) => {
 *     await element.updateIntent(async () => {
 *       const res = await fetch('/api/update', { ... });
 *       return res.json().sdkAuthorization;
 *     });
 *   };
 *
 *   return <PaymentElement ref={paymentRef} />;
 * }
 * ```
 */
export function useElements(): UseElementsReturn {
  const elements = usePaymentSession();

  const confirmPayment = useCallback(
    async (
      paymentElementRef: React.RefObject<PaymentElementHandle | null>,
      options?: { confirmParams?: JSONValue }
    ): Promise<PaymentResult> => {
      const paymentElement = paymentElementRef.current;

      if (!paymentElement) {
        throw new Error("PaymentElement is not mounted");
      }

      return paymentElement.confirmPayment(options);
    },
    []
  );

  const updateIntent = useCallback(
    async (intentResolver: () => Promise<string>): Promise<UpdateIntentResult> => {
      if (!elements) {
        throw new Error("Elements session is not initialized");
      }

      return elements.updateIntent(intentResolver);
    },
    [elements]
  );

  return {
    elements,
    confirmPayment,
    updateIntent,
  };
}
