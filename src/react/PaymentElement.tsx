import { forwardRef, useEffect, useId, useImperativeHandle, useRef } from 'react';
import { useHyperElementsContext } from './HyperElements';
import type {
  PaymentElementHandle,
  PaymentElementProps,
  PaymentElement as PaymentElementType,
  removeListenerFunction,
} from '../definitions';

const PaymentElement = forwardRef<PaymentElementHandle, PaymentElementProps>(function PaymentElement(
  { id, options, onReady, onFocus, onBlur, onChange, onPaymentResult, onPaymentConfirmButtonClick, className, style },
  ref,
) {
  const { elements } = useHyperElementsContext();

  const reactId = useId();
  const domId = id ? id : `hs-payment-element-${reactId.replace(/:/g, '')}`;

  const instanceRef = useRef<PaymentElementType | null>(null);
  // Listeners are registered once per mount and read the latest handler props from here.
  const handlersRef = useRef({ onReady, onFocus, onBlur, onChange, onPaymentResult, onPaymentConfirmButtonClick });
  handlersRef.current = { onReady, onFocus, onBlur, onChange, onPaymentResult, onPaymentConfirmButtonClick };

  function safeRemove(listener: removeListenerFunction | null | undefined): void {
    if (!listener) return;
    if (listener instanceof Promise) {
      listener.then((h) => h.remove());
    } else {
      listener.remove();
    }
  }

  useEffect(() => {
    if (!elements) return;

    const pe = elements.create({ type: 'paymentElement', options });
    instanceRef.current = pe;

    const eventListeners: removeListenerFunction[] = [
      pe.on('change', (event) => handlersRef.current.onChange?.(event)),
      pe.on('ready', () => handlersRef.current.onReady?.()),
      pe.on('focus', () => handlersRef.current.onFocus?.()),
      pe.on('blur', () => handlersRef.current.onBlur?.()),
    ];

    pe.mount(`#${domId}`);
    let element = document.getElementById(domId);
    element?.addEventListener('confirmPayment', (e: any) => {
      const { options, onResult } = (e as CustomEvent).detail;
      onResult(pe.confirmPayment(options));
    });
    let onPaymentResultListener = pe.onPaymentResult((data) => {
      handlersRef.current.onPaymentResult?.(data);
    });
    let onConfirmClicklistener = pe.onPaymentConfirmButtonClick((data) => {
      const onPaymentConfirmButtonClick = handlersRef.current.onPaymentConfirmButtonClick;
      if (onPaymentConfirmButtonClick) {
        try {
          return onPaymentConfirmButtonClick(data);
        } catch (e) {
          return false;
        }
      }
      return true;
    });

    return () => {
      pe.unmount();
      instanceRef.current = null;
      safeRemove(onPaymentResultListener);
      safeRemove(onConfirmClicklistener);
      eventListeners.forEach(safeRemove);
    };
  }, [elements]);

  useImperativeHandle(
    ref,
    () => ({
      confirmPayment(options) {
        if (!instanceRef.current) {
          return Promise.reject(new Error('PaymentElement is not mounted'));
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

  return <div id={domId} className={className} style={{ minHeight: 'inherit', width: '100%', flex: 1, ...style }} />;
});

export default PaymentElement;
