import React, { useState } from "react";
import { Hyperswitch } from "@juspay-tech/capacitor-hyperswitch";
import type {
  InitPaymentSession,
  PaymentSessionHandler,
} from "@juspay-tech/capacitor-hyperswitch";
import type { HyperswitchSession } from "@juspay-tech/capacitor-hyperswitch";
import {
  HyperElements,
  CvcWidget,
} from "@juspay-tech/capacitor-react-hyperswitch";
import type { FetchedData } from "../App";

interface Props {
  fetchedData: FetchedData | null;
  serverUrl: string;
  elementsSession: HyperswitchSession | null;
  elementsToken: string | null;
}

export default function Flow1InitPaymentSession({
  fetchedData,
  elementsSession,
  elementsToken,
}: Props) {
  const [session, setSession] = useState<InitPaymentSession | null>(null);
  const [handler, setHandler] = useState<PaymentSessionHandler | null>(null);
  const [initStatus, setInitStatus] = useState("–");
  const [sheetOutput, setSheetOutput] = useState("–");
  const [savedMethodsOutput, setSavedMethodsOutput] = useState("–");
  const [savedDataOutput, setSavedDataOutput] = useState("–");
  const [confirmSavedOutput, setConfirmSavedOutput] = useState("–");
  const [cvcMounted, setCvcMounted] = useState(false);

  const resultText = (r: { type: string; message?: string }) =>
    `type: ${r.type}${r.message ? "\nmessage: " + r.message : ""}`;

  // ── Step 2: initPaymentSession ─────────────────────────────────────────────

  const initPaymentSession = async () => {
    if (!fetchedData) {
      setInitStatus("Fetch first.");
      return;
    }
    setInitStatus("Initializing…");
    try {
      const hyper = Hyperswitch.init({
        publishableKey: fetchedData.publishableKey,
      });
      const s = await hyper.initPaymentSession({
        sdkAuthorization: fetchedData.sdkAuthorization,
      });
      setSession(s);
      setHandler(null); // reset handler when re-initializing
      setInitStatus("initPaymentSession ready.");
    } catch (err: unknown) {
      setInitStatus(
        "Error: " + (err instanceof Error ? err.message : String(err)),
      );
    }
  };

  // ── Path A: presentPaymentSheet ────────────────────────────────────────────

  const presentSheet = async () => {
    if (!session) {
      setSheetOutput("Call initPaymentSession first.");
      return;
    }
    setSheetOutput("Presenting…");
    try {
      const result = await session.presentPaymentSheet();
      setSheetOutput(resultText(result));
    } catch (err: unknown) {
      setSheetOutput(
        "Error: " + (err instanceof Error ? err.message : String(err)),
      );
    }
  };

  // ── Path B: saved methods — get handler first ──────────────────────────────

  const getCustomerSavedPaymentMethods = async () => {
    if (!session) {
      setSavedMethodsOutput("Call initPaymentSession first.");
      return;
    }
    setSavedMethodsOutput("Fetching saved methods…");
    try {
      const h = await session.getCustomerSavedPaymentMethods();
      setHandler(h);
      setSavedMethodsOutput("Handler ready (id: " + h.handlerId + ")");
    } catch (err: unknown) {
      setSavedMethodsOutput(
        "Error: " + (err instanceof Error ? err.message : String(err)),
      );
    }
  };

  const getLastUsedMethod = async () => {
    if (!handler) {
      setSavedDataOutput("Call getCustomerSavedPaymentMethods first.");
      return;
    }
    try {
      const data = await handler.getCustomerLastUsedPaymentMethodData();
      setSavedDataOutput("Last used:\n" + JSON.stringify(data, null, 2));
    } catch (err: unknown) {
      setSavedDataOutput(
        "Error: " + (err instanceof Error ? err.message : String(err)),
      );
    }
  };

  const getDefaultMethod = async () => {
    if (!handler) {
      setSavedDataOutput("Call getCustomerSavedPaymentMethods first.");
      return;
    }
    try {
      const data = await handler.getCustomerDefaultSavedPaymentMethodData();
      setSavedDataOutput("Default:\n" + JSON.stringify(data, null, 2));
    } catch (err: unknown) {
      setSavedDataOutput(
        "Error: " + (err instanceof Error ? err.message : String(err)),
      );
    }
  };

  const confirmWithLastUsed = async () => {
    if (!handler) {
      setConfirmSavedOutput("Call getCustomerSavedPaymentMethods first.");
      return;
    }
    setConfirmSavedOutput("Confirming with last used…");
    try {
      const result = await handler.confirmWithCustomerLastUsedPaymentMethod();
      setConfirmSavedOutput(resultText(result));
    } catch (err: unknown) {
      setConfirmSavedOutput(
        "Error: " + (err instanceof Error ? err.message : String(err)),
      );
    }
  };

  const confirmWithDefault = async () => {
    if (!handler) {
      setConfirmSavedOutput("Call getCustomerSavedPaymentMethods first.");
      return;
    }
    setConfirmSavedOutput("Confirming with default…");
    try {
      const result = await handler.confirmWithCustomerDefaultPaymentMethod();
      setConfirmSavedOutput(resultText(result));
    } catch (err: unknown) {
      setConfirmSavedOutput(
        "Error: " + (err instanceof Error ? err.message : String(err)),
      );
    }
  };

  return (
    <section>
      <h2>Flow 1 — initPaymentSession</h2>

      <h3>Step 2</h3>
      <button onClick={initPaymentSession} disabled={!fetchedData}>
        initPaymentSession
      </button>
      <pre>{initStatus}</pre>

      <h3>Path A — Payment Sheet</h3>
      <button onClick={presentSheet} disabled={!session}>
        presentPaymentSheet
      </button>
      <pre>{sheetOutput}</pre>

      <h3>Path B — Saved Methods</h3>
      <button onClick={getCustomerSavedPaymentMethods} disabled={!session}>
        getCustomerSavedPaymentMethods
      </button>
      <pre>{savedMethodsOutput}</pre>

      {/* CVC Widget — requires Elements session from Flow 2 */}
      {elementsSession && elementsToken ? (
        <HyperElements
          hyper={elementsSession}
          options={{ sdkAuthorization: elementsToken }}
        >
          {cvcMounted && (
            <CvcWidget
              onReady={() => console.log("[Example] CvcWidget ready")}
              style={{ minHeight: 50 }}
            />
          )}
        </HyperElements>
      ) : (
        <div className="cvc-placeholder">
          CVCWidget (requires Elements session — call elements() in Flow 2
          first)
        </div>
      )}
      <div className="btn-row" style={{ marginTop: 8 }}>
        <button onClick={() => setCvcMounted(true)}>Mount CVCWidget</button>
        <button onClick={() => setCvcMounted(false)}>Unmount CVCWidget</button>
      </div>

      <div className="btn-row" style={{ marginTop: 8 }}>
        <button onClick={getLastUsedMethod} disabled={!handler}>
          Get Last Used
        </button>
        <button onClick={getDefaultMethod} disabled={!handler}>
          Get Default
        </button>
      </div>
      <pre>{savedDataOutput}</pre>

      <div className="btn-row" style={{ marginTop: 8 }}>
        <button onClick={confirmWithLastUsed} disabled={!handler}>
          Confirm Last Used + CVC
        </button>
        <button onClick={confirmWithDefault} disabled={!handler}>
          Confirm Default + CVC
        </button>
      </div>
      <pre>{confirmSavedOutput}</pre>
    </section>
  );
}
