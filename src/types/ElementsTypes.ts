import { CustomerSavedPaymentMethodsSession } from "./CustomerSavedPaymentMethodsSessionTypes";
import { CvcWidget, CvcWidgetOptions } from "./CvcWidgetTypes";
import {
  PaymentElement,
  PaymentElementHandle,
  PaymentElementOptions,
} from "./PaymentElementTypes";
import { PaymentSessionConfiguration } from "./HyperswitchSessionTypes";
import { PaymentSession } from "./PaymentSessionTypes";
import { PaymentResult } from "./PaymentTypes";

export type Elements = Omit<PaymentSession, "presentPaymentSheet"> & {
  create(options: {
    type: "paymentElement";
    options?: PaymentElementOptions;
  }): PaymentElement;
  create(options: { type: "cvcWidget"; options?: CvcWidgetOptions }): CvcWidget;
};

export interface ElementsActions {
  confirmPayment: (
    paymentElementRef: React.RefObject<PaymentElementHandle | null> | string,
    options?: { confirmParams?: Record<string, Object> },
  ) => Promise<PaymentResult>;
  updateIntent: (
    intentResolver: () => Promise<PaymentSessionConfiguration>,
  ) => Promise<void>;
  getCustomerSavedPaymentMethods(): Promise<CustomerSavedPaymentMethodsSession>;
}
