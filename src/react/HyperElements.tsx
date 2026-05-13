import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type {
  PaymentSession,
  Elements,
  HyperswitchSession,
} from "../definitions";

interface HyperElementsContext {
  paymentSession: PaymentSession | null;
  elements: Elements | null;
  loading: boolean;
  error: Error | null;
}

const HyperElementsContext = createContext<HyperElementsContext | undefined>(
  undefined,
);

HyperElementsContext.displayName = "HyperElementsContext";

export interface HyperElementsProps {
  hyper: Promise<HyperswitchSession> | null;
  options: { sdkAuthorization: string };
  children: ReactNode;
}

export function HyperElements({
  hyper,
  options,
  children,
}: HyperElementsProps) {
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(
    null,
  );
  const [elements, setElements] = useState<Elements | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!hyper) return;

    let cancelled = false;

    (async () => {
      try {
        const session = await Promise.resolve(hyper);
        const els = await session.elements({
          sdkAuthorization: options.sdkAuthorization,
        });
        if (!cancelled) {
          setPaymentSession({
            ...els,
            presentPaymentSheet: (_) =>
              new Promise((resolve, _) => {
                resolve({
                  type: "failed",
                  message: "Function not available, use initPaymentSession",
                });
              }),
          });
          setElements(els);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hyper, options.sdkAuthorization]);

  return (
    <HyperElementsContext.Provider
      value={{ paymentSession, elements, loading, error }}
    >
      {children}
    </HyperElementsContext.Provider>
  );
}

export function useHyperElementsContext(): HyperElementsContext {
  const ctx = useContext(HyperElementsContext);
  if (ctx === undefined) {
    throw new Error(
      "useHyperElementsContext must be used inside <HyperElements>",
    );
  }
  return ctx;
}
