import type { Elements } from "../definitions";
import { useHyperElementsContext } from "./HyperElements";

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
