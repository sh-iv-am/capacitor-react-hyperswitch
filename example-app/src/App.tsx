import React, { useState } from "react";
import { Capacitor } from "@capacitor/core";
import type { HyperswitchSession } from "@juspay-tech/capacitor-hyperswitch";
import Flow1InitPaymentSession from "./components/Flow1InitPaymentSession";
import Flow2Elements from "./components/Flow2Elements";

const SERVER_URL =
  Capacitor.getPlatform() === "android"
    ? "http://10.0.2.2:5252"
    : "http://localhost:5252";

export interface FetchedData {
  publishableKey: string;
  sdkAuthorization: string;
  paymentId?: string;
  profileId?: string;
}

export { SERVER_URL };

export default function App() {
  const [fetchedData, setFetchedData] = useState<FetchedData | null>(null);
  const [fetchStatus, setFetchStatus] = useState<string>("–");
  const [fetching, setFetching] = useState(false);

  // Shared elements session — created in Flow2, used by Flow1's CvcWidget
  const [elementsSession, setElementsSession] =
    useState<HyperswitchSession | null>(null);
  const [elementsToken, setElementsToken] = useState<string | null>(null);

  const fetchPaymentIntent = async () => {
    setFetching(true);
    setFetchStatus("Fetching…");
    try {
      const res = await fetch(`${SERVER_URL}/create-payment-intent`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data: FetchedData = await res.json();
      setFetchedData(data);
      setFetchStatus(
        `publishableKey: ${data.publishableKey}\n` +
          `sdkAuthorization: ${data.sdkAuthorization}\n` +
          `paymentId: ${data.paymentId ?? "(none)"}`,
      );
    } catch (err: unknown) {
      setFetchedData(null);
      setFetchStatus(
        "Error: " + (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      setFetching(false);
    }
  };

  return (
    <main>
      <h1>Capacitor React Hyperswitch</h1>

      {/* ── Step 1 — Fetch ─────────────────────────────────────────────── */}
      <section>
        <h2>Step 1 — Fetch Payment Intent</h2>
        <button onClick={fetchPaymentIntent} disabled={fetching}>
          {fetching ? "Fetching…" : "Fetch"}
        </button>
        <pre>{fetchStatus}</pre>
      </section>

      {/* ── Flow 1 — initPaymentSession ────────────────────────────────── */}
      <Flow1InitPaymentSession
        fetchedData={fetchedData}
        serverUrl={SERVER_URL}
        elementsSession={elementsSession}
        elementsToken={elementsToken}
      />

      {/* ── Flow 2 — Elements ──────────────────────────────────────────── */}
      <Flow2Elements
        fetchedData={fetchedData}
        serverUrl={SERVER_URL}
        onSessionReady={(session, token) => {
          setElementsSession(session);
          setElementsToken(token);
        }}
      />
    </main>
  );
}
