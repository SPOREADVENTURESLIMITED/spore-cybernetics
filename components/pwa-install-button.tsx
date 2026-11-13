"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Spore app service worker registration failed:", error);
      });
    }

    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) setInstalled(true);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setShowHelp(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) {
      setShowHelp(true);
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstallPrompt(null);
  };

  return (
    <div className="pwa-install-wrap" style={{ padding: "10px 18px", display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10 }}>
      <button type="button" className="btn pwa-install-btn" onClick={install} disabled={installed} aria-label="Install Spore Cybernetics app">
        <Smartphone size={16} /> {installed ? "App Installed" : "Install Spore App"}
      </button>
      {showHelp && (
        <div role="dialog" aria-modal="true" aria-labelledby="pwa-install-help-title" style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.72)", display: "grid", placeItems: "center", padding: 20 }}>
          <div style={{ position: "relative", width: "min(100%, 420px)", background: "#07152f", color: "#fff", border: "1px solid #28436c", borderRadius: 16, padding: 24 }}>
            <button type="button" onClick={() => setShowHelp(false)} aria-label="Close install instructions" style={{ position: "absolute", right: 14, top: 14, background: "transparent", color: "inherit", border: 0 }}><X size={20} /></button>
            <h2 id="pwa-install-help-title">Install Spore Cybernetics</h2>
            <p>To add the online app to your Android home screen:</p>
            <ol style={{ paddingLeft: 22, lineHeight: 1.8 }}>
              <li>Open this website in Google Chrome.</li>
              <li>Tap Chrome’s three-dot menu (⋮).</li>
              <li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
              <li>Confirm by tapping <strong>Install</strong> or <strong>Add</strong>.</li>
            </ol>
            <p style={{ fontSize: 13, opacity: .8 }}>If the install option is missing, update Chrome and reopen this website over HTTPS.</p>
          </div>
        </div>
      )}
    </div>
  );
}
