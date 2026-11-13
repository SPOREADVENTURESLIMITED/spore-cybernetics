"use client";

import { Download } from "lucide-react";

const APK_DOWNLOAD_URL =
  "https://github.com/SPOREADVENTURESLIMITED/spore-cybernetics/releases/download/android-latest/spore-cybernetics.apk";

export function PwaInstallButton() {
  return (
    <div className="pwa-install-wrap">
      <a
        className="btn pwa-install-btn"
        href={APK_DOWNLOAD_URL}
        download="spore-cybernetics.apk"
        aria-label="Download Spore Cybernetics Android app"
      >
        <Download size={15} /> Download Android App
      </a>
    </div>
  );
}
