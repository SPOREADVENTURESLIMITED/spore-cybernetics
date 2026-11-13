"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function PwaInstallButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIos(/iphone|ipad|ipod/i.test(window.navigator.userAgent));
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
      setHelpOpen(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!promptEvent) {
      setHelpOpen(value => !value);
      return;
    }
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setPromptEvent(null);
  }

  if (installed) return null;
  return (
    <div className="pwa-install-wrap">
      <button className="btn pwa-install-btn" type="button" onClick={install}>
        <Download size={15} /> Install App
      </button>
      {helpOpen && (
        <div className="pwa-install-help" role="status">
          <button className="pwa-help-close" type="button" aria-label="Close installation help" onClick={() => setHelpOpen(false)}><X size={15}/></button>
          <strong>Install Spore Cybernetics</strong>
          {ios ? (
            <p>In Safari, tap <Share size={14} className="pwa-inline-icon"/> Share, then choose <b>Add to Home Screen</b>.</p>
          ) : (
            <p>In your browser menu (⋮), choose <b>Install app</b> or <b>Add to Home screen</b>. If you don't see it, open this site in Chrome.</p>
          )}
        </div>
      )}
    </div>
  );
}
