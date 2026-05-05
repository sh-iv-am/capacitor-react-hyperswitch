import React, {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  type CSSProperties,
} from "react";
import { useHyperElementsContext } from "./HyperElements";
import type { PaymentElement as PaymentElementType, PaymentEventData, PaymentResult, JSONValue } from "../definitions";
// ── Handle (what callers get via ref) ─────────────────────────────────────────

/**
 * Methods exposed on the `<PaymentElement>` ref.
 *
 * @example
 * ```tsx
 * const ref = useRef<PaymentElementHandle>(null);
 * // ...
 * const result = await ref.current?.confirmPayment({ confirmParams: { returnUrl: '...' } });
 * ```
 */
export interface PaymentElementHandle {
  /** Confirm the payment through the mounted PaymentElement. */
  confirmPayment(options?: {
    confirmParams?: JSONValue;
  }): Promise<PaymentResult>;
  /** Collapse the payment element (hides expanded sections). */
  collapse(): void;
  /** Focus the first interactive field. */
  focus(): void;
  /** Blur all fields. */
  blur(): void;
  /** Clear all field values. */
  clear(): void;
  /** Update the element's display options. */
  update(options: JSONValue): void;
  /** Destroy the element and release native resources. */
  destroy(): void;
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface PaymentElementProps {
  /** Called once the native element has been successfully mounted. */
  onReady?: () => void;
  /** Called when the element emits a change event (FORM_STATUS, PAYMENT_METHOD_STATUS, etc.). */
  onChange?: (data?: PaymentEventData) => void;
  /** Extra CSS applied to the placeholder `<div>`. */
  style?: CSSProperties;
  /** Extra class name applied to the placeholder `<div>`. */
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Drop-in React component that mounts the native `PaymentElement` view.
 * Must be rendered inside `<HyperElements>`.
 *
 * @example
 * ```tsx
 * const ref = useRef<PaymentElementHandle>(null);
 *
 * <PaymentElement
 *   ref={ref}
 *   onReady={() => setReady(true)}
 *   style={{ minHeight: 200 }}
 * />
 *
 * <button onClick={() => ref.current?.confirmPayment()}>Pay</button>
 * ```
 */
const PaymentElement = forwardRef<PaymentElementHandle, PaymentElementProps>(
  function PaymentElement({ onReady, onChange, style, className }, ref) {
    const { elements } = useHyperElementsContext();

    // A stable, unique id for the placeholder div so mount() can find it.
    const reactId = useId();
    const domId = `hs-payment-element-${reactId.replace(/:/g, "")}`;

    // Hold the live PaymentElement instance so the handle methods can reach it.
    const instanceRef = useRef<PaymentElementType | null>(null);

    useEffect(() => {
      if (!elements) return;

      const pe = elements.create({ type: "paymentElement" });
      instanceRef.current = pe;

      // Wire change/status events (FORM_STATUS, PAYMENT_METHOD_STATUS, etc.)
      if (onChange) {
        pe.on("FORM_STATUS", onChange);
        pe.on("PAYMENT_METHOD_STATUS", onChange);
        pe.on("PAYMENT_METHOD_INFO_CARD", onChange);
        pe.on("PAYMENT_METHOD_INFO_BILLING_ADDRESS", onChange);
      }

      pe.mount(`#${domId}`);

      // Fire onReady after mount — no native "ready" event exists.
      if (onReady) onReady();

      return () => {
        pe.unmount();
        instanceRef.current = null;
      };
      // `elements` identity changes when the session is re-created (new token).
      // `domId` is stable for the lifetime of this component instance.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [elements]);

    // Expose imperative handle to the caller's ref.
    useImperativeHandle(
      ref,
      () => ({
        confirmPayment(options) {
          if (!instanceRef.current) {
            return Promise.reject(new Error("PaymentElement is not mounted"));
          }
          return instanceRef.current.confirmPayment(options);
        },
        collapse() {
          instanceRef.current?.collapse();
        },
        focus() {
          instanceRef.current?.focus();
        },
        blur() {
          instanceRef.current?.blur();
        },
        clear() {
          instanceRef.current?.clear();
        },
        update(options) {
          instanceRef.current?.update(options);
        },
        destroy() {
          instanceRef.current?.destroy();
          instanceRef.current = null;
        },
      }),
      [],
    );

    return (
      <div
        id={domId}
        className={className}
        style={{ minHeight: 200, width: "100%", ...style }}
      />
    );
  },
);

export default PaymentElement;
