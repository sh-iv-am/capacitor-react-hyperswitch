import React, { forwardRef, useEffect, useId, useImperativeHandle, useRef, type CSSProperties } from 'react';
import { useHyperElementsContext } from './HyperElements';
import { registerWidget, unregisterWidget } from './widget-registry';
import type {
  CvcWidget as CvcWidgetType,
  CvcWidgetOptions,
  PaymentEvent,
  removeListenerFunction,
} from '../definitions';

export interface CvcWidgetHandle {
  unmount(): void;
}

export interface CvcWidgetProps {
  id?: string;
  options?: CvcWidgetOptions;
  /** Receives every event listed in `options.subscriptionEvents`; filter on `event.eventName`. */
  onChange?: (event: PaymentEvent) => void;
  /** Fires when the CVC input gains focus. No subscription needed. */
  onFocus?: () => void;
  /** Fires when the CVC input loses focus. No subscription needed. */
  onBlur?: () => void;
  /** Fires when the native widget reports `ready` (on its mount), not when this component mounts. */
  onReady?: () => void;
  style?: CSSProperties;
  className?: string;
}

const CvcWidget = forwardRef<CvcWidgetHandle, CvcWidgetProps>(function CvcWidgetComponent(
  { id, options, onChange, onFocus, onBlur, onReady, style, className },
  ref,
) {
  const { elements } = useHyperElementsContext();

  const reactId = useId();
  const domId = `hs-cvc-widget-${reactId.replace(/:/g, '')}`;

  const instanceRef = useRef<CvcWidgetType | null>(null);
  // Listeners are registered once per mount and read the latest handler props from here.
  const handlersRef = useRef({ onChange, onFocus, onBlur, onReady });
  handlersRef.current = { onChange, onFocus, onBlur, onReady };

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

    const widget = elements.create({ type: 'cvcWidget', options });
    instanceRef.current = widget;

    // Registered before mount so the widget's `ready` (fired on its mount) is not missed.
    const listeners: (removeListenerFunction | null)[] = [
      widget.on('change', (event: PaymentEvent) => handlersRef.current.onChange?.(event)),
      widget.on('ready', () => handlersRef.current.onReady?.()),
      widget.on('focus', () => handlersRef.current.onFocus?.()),
      widget.on('blur', () => handlersRef.current.onBlur?.()),
    ];

    widget.mount(`#${domId}`);

    if (id) {
      registerWidget(id, widget);
    }

    return () => {
      if (id) {
        unregisterWidget(id);
      }
      widget.unmount();
      listeners.forEach(safeRemove);
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

  return <div id={domId} className={className} style={{ minHeight: 'inherit', width: '100%', ...style }} />;
});

export default CvcWidget;
