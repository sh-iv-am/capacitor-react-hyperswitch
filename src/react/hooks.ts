import { useCallback, useMemo } from "react";
import type {
  PaymentSession,
  PaymentSessionConfiguration,
  PaymentResult,
  PaymentElementHandle,
  ElementsActions,
  CustomerSavedPaymentMethodsSession,
} from "../definitions";
import { useHyperElementsContext } from "./HyperElements";

export function usePaymentSession(): PaymentSession | null {
  const { paymentSession } = useHyperElementsContext();

  const updateIntent = useCallback(
    async (
      intentResolver: () => Promise<PaymentSessionConfiguration>,
    ): Promise<void> => {
      if (!paymentSession) {
        throw new Error("HyperElements is not initialized");
      }

      return paymentSession.updateIntent(intentResolver);
    },
    [paymentSession],
  );

  return useMemo(
    () =>
      paymentSession ? { ...paymentSession, updateIntent } : paymentSession,
    [paymentSession, updateIntent],
  );
}

export function useElements(): ElementsActions {
  const { elements } = useHyperElementsContext();

  const confirmPayment = useCallback(
    async (
      paymentElement: React.RefObject<PaymentElementHandle | null> | string,
      options?: { confirmParams?: Record<string, Object> },
    ): Promise<PaymentResult> => {
      if (typeof paymentElement === "string") {
        const element = document.getElementById(paymentElement);

        if (!element) {
          throw new Error(`Element with id "${paymentElement}" not found`);
        }

        return new Promise<PaymentResult>((resolve, _) => {
          element.dispatchEvent(
            new CustomEvent("confirmPayment", {
              bubbles: true,
              cancelable: true,
              detail: {
                options,
                onResult: (result: PaymentResult) => {
                  resolve(result);
                },
              },
            }),
          );
        });
      } else {
        const paymentElementRef = paymentElement.current;

        if (!paymentElementRef) {
          throw new Error("PaymentElement is not mounted");
        }

        return paymentElementRef.confirmPayment(options);
      }
    },
    [],
  );

  const updateIntent = useCallback(
    async (
      intentResolver: () => Promise<PaymentSessionConfiguration>,
    ): Promise<void> => {
      if (!elements) {
        throw new Error("HyperElements is not initialized");
      }

      return elements.updateIntent(intentResolver);
    },
    [elements],
  );

  const getCustomerSavedPaymentMethods =
    useCallback(async (): Promise<CustomerSavedPaymentMethodsSession> => {
      if (!elements) {
        throw new Error("HyperElements is not initialized");
      }

      return elements.getCustomerSavedPaymentMethods();
    }, [elements]);

  return {
    getCustomerSavedPaymentMethods,
    confirmPayment,
    updateIntent,
  };
}
