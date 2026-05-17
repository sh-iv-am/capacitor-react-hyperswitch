import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
} from "react";
import { useHyperElementsContext } from "./HyperElements";
import type {
  PaymentElementHandle,
  PaymentElementProps,
  PaymentElement as PaymentElementType,
} from "../definitions";

const PaymentElement = forwardRef<PaymentElementHandle, PaymentElementProps>(
  function PaymentElement(
    {
      id,
      options,
      onReady,
      onChange,
      onPaymentResult,
      onPaymentConfirmButtonClick,
      className,
      style,
    },
    ref,
  ) {
    const { elements } = useHyperElementsContext();

    const reactId = useId();
    const domId = id ? id : `hs-payment-element-${reactId.replace(/:/g, "")}`;

    const instanceRef = useRef<PaymentElementType | null>(null);

    useEffect(() => {
      if (!elements) return;

      const pe = elements.create({ type: "paymentElement", options });
      instanceRef.current = pe;

      if (onChange) {
        pe.on("FORM_STATUS", onChange);
        pe.on("PAYMENT_METHOD_STATUS", onChange);
        pe.on("PAYMENT_METHOD_INFO_CARD", onChange);
        pe.on("PAYMENT_METHOD_INFO_BILLING_ADDRESS", onChange);
      }

      pe.mount(`#${domId}`);
      let element = document.getElementById(domId);
      element?.addEventListener("confirmPayment", (e: any) => {
        const { options, onResult } = (e as CustomEvent).detail;
        onResult(pe.confirmPayment(options));
      });
      pe.onPaymentResult((data) => {
        onPaymentResult ? onPaymentResult(data) : null;
      });
      pe.onPaymentConfirmButtonClick((data) => {
        if (onPaymentConfirmButtonClick) {
          try {
            return onPaymentConfirmButtonClick(data);
          } catch (e) {
            return false;
          }
        }
        return true;
      });

      if (onReady) onReady();

      return () => {
        pe.unmount();
        instanceRef.current = null;
      };
    }, [elements]);

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
        style={{ minHeight: "inherit", width: "100%", flex: 1, ...style }}
      />
    );
  },
);

export default PaymentElement;
