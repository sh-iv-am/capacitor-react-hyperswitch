import { useCallback, useRef, useState } from "react";
import type { Elements, JSONValue, PaymentResult } from "../definitions";
import { useHyperElementsContext } from "./HyperElements";
import type { PaymentElementHandle } from "./PaymentElement";

/**
 * Returns the `Elements` session from the nearest `<HyperElements>` ancestor.
 *
 * - Returns `null` while the session is still loading.
 * - Throws if called outside of `<HyperElements>`.
 *
 * Use this hook when you need direct access to session-level methods such as
 * `updateIntent`, `getCustomerDefaultSavedPaymentMethodData`, or
 * `confirmWithCustomerLastUsedPaymentMethod`.
 *
 * @example
 * ```tsx
 * function CheckoutForm() {
 *   const paymentSession = usePaymentSession();
 *
 *   const handleUpdate = async () => {
 *     const newToken = await fetchNewToken();
 *     await paymentSession?.updateIntent(() => Promise.resolve(newToken));
 *   };
 * }
 * ```
 */
export function usePaymentSession(): Elements | null {
  const { elements } = useHyperElementsContext();
  return elements;
}

// ── Payment Confirmation Hook ─────────────────────────────────────────────────

export interface ConfirmPaymentState {
  /** Whether a confirmation is in progress */
  isLoading: boolean;
  /** The result of the last confirmation attempt */
  result: PaymentResult | null;
  /** Any error from the last confirmation attempt */
  error: Error | null;
}

export interface ConfirmPaymentActions {
  /** Trigger the payment confirmation */
  confirm: (options?: { confirmParams?: JSONValue }) => Promise<PaymentResult>;
  /** Reset the state to initial values */
  reset: () => void;
}

export type UseConfirmPaymentReturn = ConfirmPaymentState & ConfirmPaymentActions;

/**
 * Hook for managing PaymentElement confirmation state.
 *
 * This hook provides a declarative way to handle payment confirmation with
 * built-in loading states and error handling. It maintains a registry of
 * the PaymentElement ref to ensure reliable access during confirmation.
 *
 * @param paymentElementRef - Ref to the PaymentElement component
 * @returns State and actions for payment confirmation
 *
 * @example
 * ```tsx
 * function CheckoutForm() {
 *   const paymentRef = useRef<PaymentElementHandle>(null);
 *   const { confirm, isLoading, result, error, reset } = useConfirmPayment(paymentRef);
 *
 *   const handleSubmit = async () => {
 *     const result = await confirm({
 *       confirmParams: { return_url: window.location.origin }
 *     });
 *     if (result.type === 'completed') {
 *       // Handle success
 *     }
 *   };
 *
 *   return (
 *     <>
 *       <PaymentElement ref={paymentRef} />
 *       <button onClick={handleSubmit} disabled={isLoading}>
 *         {isLoading ? 'Processing...' : 'Pay'}
 *       </button>
 *       {error && <p>Error: {error.message}</p>}
 *       {result && <p>Status: {result.type}</p>}
 *     </>
 *   );
 * }
 * ```
 */
export function useConfirmPayment(
  paymentElementRef: React.RefObject<PaymentElementHandle | null>
): UseConfirmPaymentReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Registry to track confirmation in-flight state
  const confirmationRegistry = useRef<{
    isConfirming: boolean;
    abortController: AbortController | null;
  }>({
    isConfirming: false,
    abortController: null,
  });

  const confirm = useCallback(
    async (options?: { confirmParams?: JSONValue }): Promise<PaymentResult> => {
      const element = paymentElementRef.current;

      if (!element) {
        const err = new Error("PaymentElement is not mounted");
        setError(err);
        throw err;
      }

      // Prevent concurrent confirmations
      if (confirmationRegistry.current.isConfirming) {
        const err = new Error("Payment confirmation already in progress");
        setError(err);
        throw err;
      }

      // Set up abort controller for cancellation support
      confirmationRegistry.current.abortController = new AbortController();
      confirmationRegistry.current.isConfirming = true;

      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
        const paymentResult = await element.confirmPayment(options);

        // Check if aborted
        if (confirmationRegistry.current.abortController?.signal.aborted) {
          const abortError = new Error("Payment confirmation was cancelled");
          setError(abortError);
          throw abortError;
        }

        setResult(paymentResult);
        return paymentResult;
      } catch (err) {
        const errorInstance = err instanceof Error ? err : new Error(String(err));
        setError(errorInstance);
        throw errorInstance;
      } finally {
        setIsLoading(false);
        confirmationRegistry.current.isConfirming = false;
        confirmationRegistry.current.abortController = null;
      }
    },
    [paymentElementRef]
  );

  const reset = useCallback(() => {
    // Cancel any in-flight confirmation
    if (confirmationRegistry.current.abortController) {
      confirmationRegistry.current.abortController.abort();
    }
    confirmationRegistry.current.isConfirming = false;
    confirmationRegistry.current.abortController = null;

    setIsLoading(false);
    setResult(null);
    setError(null);
  }, []);

  return {
    isLoading,
    result,
    error,
    confirm,
    reset,
  };
}
