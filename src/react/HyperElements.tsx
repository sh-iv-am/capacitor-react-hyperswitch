import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Elements } from "../definitions";

// ── Context ───────────────────────────────────────────────────────────────────

interface HyperElementsContextValue {
  /** Resolved Elements session; null while loading or on error. */
  elements: Elements | null;
  /** True while the Elements session is being created. */
  loading: boolean;
  /** Set when initialisation failed. */
  error: Error | null;
}

const HyperElementsContext = createContext<
  HyperElementsContextValue | undefined
>(undefined);

HyperElementsContext.displayName = "HyperElementsContext";

// ── Structural type for session compatibility ─────────────────────────────────
// Using structural typing to accept HyperswitchSession from any source
// (capacitor-hyperswitch or capacitor-react-hyperswitch definitions)
// Using `any` return type to accommodate TypeScript resolution differences
interface HyperSessionLike {
  elements(options: { sdkAuthorization: string }): Promise<any>;
}

// ── Provider props ────────────────────────────────────────────────────────────

export interface HyperElementsProps {
  /**
   * The value returned by `Hyperswitch.init(config)`.
   * Accepts the session object directly or wrapped in a Promise for
   * parity with lazy-loaded patterns.
   */
  hyper: HyperSessionLike | Promise<HyperSessionLike> | null;
  /**
   * Options forwarded to `session.elements(...)`.
   * `sdkAuthorization` is the client secret / session token from your server.
   */
  options: { sdkAuthorization: string };
  children: ReactNode;
}

// ── Provider ──────────────────────────────────────────────────────────────────

/**
 * Wrap your checkout tree in `<HyperElements>`.
 * It resolves the session, calls `elements()`, and makes the resulting
 * `Elements` object available to every descendant via `usePaymentSession()`.
 *
 * @example
 * ```tsx
 * const hyper = Hyperswitch.init({ publishableKey: 'pk_...' });
 *
 * <HyperElements hyper={hyper} options={{ sdkAuthorization: token }}>
 *   <CheckoutForm />
 * </HyperElements>
 * ```
 */
export function HyperElements({
  hyper,
  options,
  children,
}: HyperElementsProps) {
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
    // Re-run when the token changes (new payment intent).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hyper, options.sdkAuthorization]);

  return (
    <HyperElementsContext.Provider value={{ elements, loading, error }}>
      {children}
    </HyperElementsContext.Provider>
  );
}

// ── Internal hook (used by PaymentElement / CvcWidget components) ─────────────

export function useHyperElementsContext(): HyperElementsContextValue {
  const ctx = useContext(HyperElementsContext);
  if (ctx === undefined) {
    throw new Error(
      "useHyperElementsContext must be used inside <HyperElements>",
    );
  }
  return ctx;
}
