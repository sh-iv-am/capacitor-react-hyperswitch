import React, {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  type CSSProperties,
} from "react";
import type {
  CvcWidget as ICvcWidget,
  CvcWidgetOptions,
  PaymentEventData,
} from "capacitor-hyperswitch";
import { useHyperElementsContext } from "./HyperElements";
import { registerWidget, unregisterWidget } from "./widget-registry";

export interface CvcWidgetHandle {
  unmount(): void;
}

export interface CvcWidgetProps {
  id?: string;
  options?: CvcWidgetOptions;
  onChange?: (data?: PaymentEventData) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onReady?: () => void;
  style?: CSSProperties;
  className?: string;
}

const CvcWidget = forwardRef<CvcWidgetHandle, CvcWidgetProps>(
  function CvcWidget({ id, options, onChange, onFocus, onBlur, onReady, style, className }, ref) {
    const { elements } = useHyperElementsContext();

    const reactId = useId();
    const domId = `hs-cvc-widget-${reactId.replace(/:/g, "")}`;

    const instanceRef = useRef<ICvcWidget | null>(null);

    useEffect(() => {
      if (!elements) return;

      const widget = elements.create({ type: "cvcWidget", options });
      instanceRef.current = widget;

      let wasFocused = false;

      if (onChange || onFocus || onBlur) {
        widget.on("change", (data) => {
          if (onChange) onChange(data);
          if ((onFocus || onBlur) && data?.type === "CVC_STATUS") {
            const cvcStatus = (data?.payload as Record<string, unknown> | undefined)?.cvcStatus as Record<string, unknown> | undefined;
            const isFocused = !!cvcStatus?.isCvcFocused;
            if (isFocused && !wasFocused && onFocus) onFocus();
            if (!isFocused && wasFocused && onBlur) onBlur();
            wasFocused = isFocused;
          }
        });
      }

      widget.mount(`#${domId}`);

      if (id) {
        registerWidget(id, widget);
      }

      if (onReady) {
        onReady();
      }

      return () => {
        if (id) {
          unregisterWidget(id);
        }
        widget.unmount();
        instanceRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [elements]);

    useImperativeHandle(
      ref,
      () => ({
        unmount() {
          if (id) {
            unregisterWidget(id);
          }
          instanceRef.current?.unmount();
          instanceRef.current = null;
        },
      }),
      [id],
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
