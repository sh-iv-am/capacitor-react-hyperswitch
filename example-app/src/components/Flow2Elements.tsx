import React, { useRef, useState } from 'react';
import { Hyperswitch } from '@juspay-tech/capacitor-hyperswitch';
import type { HyperswitchSession } from '@juspay-tech/capacitor-hyperswitch';
import {
  HyperElements,
  PaymentElement,
  usePaymentSession,
} from '@juspay-tech/capacitor-react-hyperswitch';
import type { PaymentElementHandle } from '@juspay-tech/capacitor-react-hyperswitch';
import type { FetchedData } from '../App';

// ── Inner checkout form — must live inside <HyperElements> ────────────────────

function CheckoutForm({ fetchedData, serverUrl }: { fetchedData: FetchedData; serverUrl: string }) {
  const paymentSession = usePaymentSession();
  const paymentRef = useRef<PaymentElementHandle>(null);
  const [mounted, setMounted] = useState(false);
  const [confirmOutput, setConfirmOutput] = useState('–');

  const resultText = (r: { type: string; message?: string }) =>
    `type: ${r.type}${r.message ? '\nmessage: ' + r.message : ''}`;

  const confirmViaElement = async () => {
    setConfirmOutput('Confirming…');
    try {
      const result = await paymentRef.current?.confirmPayment({
        confirmParams: { returnUrl: window.location.href },
      });
      setConfirmOutput(result ? resultText(result) : 'No result');
    } catch (err: unknown) {
      setConfirmOutput('Error: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const updateIntent = async () => {
    if (!fetchedData.paymentId) {
      setConfirmOutput('No paymentId available.');
      return;
    }
    setConfirmOutput('Updating intent…');
    try {
      const result = await paymentSession?.updateIntent(async () => {
        const res = await fetch(`${serverUrl}/update-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId: fetchedData.paymentId,
            currency: 'HKD',
            amount: 2999,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()).sdkAuthorization as string;
      });
      setConfirmOutput('updateIntent result: ' + JSON.stringify(result));
    } catch (err: unknown) {
      setConfirmOutput('Error: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <>
      {/* Step 3 — Mount PaymentElement */}
      <h3>Step 3 — Mount PaymentElement</h3>
      <div className="payment-placeholder-container">
        {mounted ? (
          <PaymentElement
            ref={paymentRef}
            onReady={() => console.log('[Example] PaymentElement ready')}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <div className="payment-placeholder"><span>PaymentElement</span></div>
        )}
      </div>
      <div className="btn-row" style={{ marginTop: 8 }}>
        <button onClick={() => setMounted(true)}>Mount</button>
        <button onClick={() => setMounted(false)}>Unmount</button>
      </div>

      {/* Step 4 — Confirm / Update */}
      <h3>Step 4</h3>
      <div className="btn-row">
        <button onClick={confirmViaElement}>confirmPayment</button>
        <button onClick={updateIntent}>updateIntent</button>
      </div>
      <pre>{confirmOutput}</pre>
    </>
  );
}

// ── Flow 2 wrapper ────────────────────────────────────────────────────────────

interface Props {
  fetchedData: FetchedData | null;
  serverUrl: string;
  onSessionReady: (session: HyperswitchSession, token: string) => void;
}

export default function Flow2Elements({ fetchedData, serverUrl, onSessionReady }: Props) {
  const [session, setSession] = useState<HyperswitchSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [elementsStatus, setElementsStatus] = useState('–');

  const initElements = async () => {
    if (!fetchedData) { setElementsStatus('Fetch first.'); return; }
    setElementsStatus('Creating Elements session…');
    try {
      const s = Hyperswitch.init({ publishableKey: fetchedData.publishableKey });
      setSession(s);
      setToken(fetchedData.sdkAuthorization);
      onSessionReady(s, fetchedData.sdkAuthorization);
      setElementsStatus('Elements session ready.');
    } catch (err: unknown) {
      setElementsStatus('Error: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <section>
      <h2>Flow 2 — Elements</h2>

      <h3>Step 2</h3>
      <button onClick={initElements} disabled={!fetchedData}>
        elements()
      </button>
      <pre>{elementsStatus}</pre>

      {session && token && (
        <HyperElements hyper={session} options={{ sdkAuthorization: token }}>
          <CheckoutForm fetchedData={fetchedData!} serverUrl={serverUrl} />
        </HyperElements>
      )}
    </section>
  );
}
