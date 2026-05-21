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
  removeListenerFunction,
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

    function safeRemove(
      listener: removeListenerFunction | null | undefined,
    ): void {
      if (!listener) return;
      if (listener instanceof Promise) {
        listener.then((h) => h.remove());
      } else {
        listener.remove();
      }
    }

    useEffect(() => {
      if (!elements) return;

      const pe = elements.create({ type: "paymentElement", options });
      instanceRef.current = pe;

      let onChangeListeners: removeListenerFunction[] = [];
      if (onChange) {
        onChangeListeners.push(pe.on("FORM_STATUS", onChange));
        onChangeListeners.push(pe.on("PAYMENT_METHOD_STATUS", onChange));
        onChangeListeners.push(pe.on("PAYMENT_METHOD_INFO_CARD", onChange));
        onChangeListeners.push(
          pe.on("PAYMENT_METHOD_INFO_BILLING_ADDRESS", onChange),
        );
      }

      pe.mount(`#${domId}`);
      let element = document.getElementById(domId);
      let listener = element?.addEventListener("confirmPayment", (e: any) => {
        const { options, onResult } = (e as CustomEvent).detail;
        onResult(pe.confirmPayment(options));
      });
      let onPaymentResultListener = onPaymentResult
        ? pe.onPaymentResult((data) => {
            onPaymentResult(data);
          })
        : null;
      let onConfirmClicklistener = onPaymentConfirmButtonClick
        ? pe.onPaymentConfirmButtonClick((data) => {
            try {
              return onPaymentConfirmButtonClick(data);
            } catch (e) {
              return false;
            }
          })
        : null;

      if (onReady) onReady();

      return () => {
        pe.unmount();
        instanceRef.current = null;
        safeRemove(onPaymentResultListener);
        safeRemove(onConfirmClicklistener);
        if (listener) {
          element?.removeEventListener("confirmPayment", listener);
        }
        onChangeListeners.forEach(safeRemove);
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
