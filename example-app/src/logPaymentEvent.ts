import type { PaymentEvent } from "@juspay-tech/capacitor-react-hyperswitch";

/** One handler receives every event listed in `subscriptionEvents`; branch on its name. */
export function logPaymentEvent(event: PaymentEvent): void {
  switch (event.eventName) {
    case "paymentMethodChange":
      console.log("[Example] payment method:", event.payload.paymentMethod, event.payload.paymentMethodType);
      break;
    case "cardDetailsChange":
      console.log("[Example] card:", event.payload.brand, "complete:", event.payload.isCardNumberComplete);
      break;
    case "formStatusChange":
      console.log("[Example] form status:", event.payload.status);
      break;
    case "billingDetailsChange":
      console.log("[Example] billing:", event.payload.country, event.payload.state, event.payload.postalCode);
      break;
    case "cvcStatusChange":
      console.log("[Example] cvc:", JSON.stringify(event.payload));
      break;
  }
}
