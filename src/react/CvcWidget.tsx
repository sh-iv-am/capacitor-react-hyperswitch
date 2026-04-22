import React, {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  type CSSProperties,
} from "react";
import type { CvcWidget as ICvcWidget } from "capacitor-hyperswitch";
import { useHyperElementsContext } from "./HyperElements";

// ── Handle ────────────────────────────────────────────────────────────────────

/**
 * Methods exposed on the `<CvcWidget>` ref.
 */
export interface CvcWidgetHandle {
  /** Programmatically unmount the widget. */
  unmount(): void;
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface CvcWidgetProps {
  /** Called once the native widget has been successfully mounted. */
  onReady?: () => void;
  /** Extra CSS applied to the placeholder `<div>`. */
  style?: CSSProperties;
  /** Extra class name applied to the placeholder `<div>`. */
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Drop-in React component that mounts the native `CVCWidget` view.
 * Must be rendered inside `<HyperElements>`.
 *
 * Typically used alongside `confirmWithCustomerDefaultPaymentMethod` or
 * `confirmWithCustomerLastUsedPaymentMethod` from `usePaymentSession()`.
 *
 * @example
 * ```tsx
 * const paymentSession = usePaymentSession();
 *
 * <CvcWidget style={{ minHeight: 50 }} />
 *
 * <button onClick={() => paymentSession?.confirmWithCustomerLastUsedPaymentMethod()}>
 *   Pay with saved card
 * </button>
 * ```
 */
const CvcWidget = forwardRef<CvcWidgetHandle, CvcWidgetProps>(
  function CvcWidget({ onReady, style, className }, ref) {
    const { elements } = useHyperElementsContext();

    const reactId = useId();
    const domId = `hs-cvc-widget-${reactId.replace(/:/g, "")}`;

    const instanceRef = useRef<ICvcWidget | null>(null);

    useEffect(() => {
      if (!elements) return;

      const widget = elements.create({ type: "cvcWidget" });
      instanceRef.current = widget;

      widget.mount(`#${domId}`);

      if (onReady) {
        // CvcWidget has no event system; fire onReady synchronously after mount.
        onReady();
      }

      return () => {
        widget.unmount();
        instanceRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [elements]);

    useImperativeHandle(
      ref,
      () => ({
        unmount() {
          instanceRef.current?.unmount();
          instanceRef.current = null;
        },
      }),
      [],
    );

    return (
      <div
        id={domId}
        className={className}
        style={{ minHeight: 50, width: "100%", ...style }}
      />
    );
  },
);

export default CvcWidget;
