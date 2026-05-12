import React, { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";

import ModelSelector from "../model-selector";
import UpdateChecker from "../update-checker";

const PRODUCT_NAME = "Mots Dits";

const Footer: React.FC = () => {
  const [version, setVersion] = useState("");

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const appVersion = await getVersion();
        setVersion(appVersion);
      } catch (error) {
        console.error("Failed to get app version:", error);
        setVersion("0.2.0");
      }
    };

    fetchVersion();
  }, []);

  return (
    <footer className="paper-footer" aria-label="État de l’application">
      <div className="paper-footer-model">
        <ModelSelector />
      </div>

      <div className="paper-footer-meta">
        <span className="paper-footer-brand">{PRODUCT_NAME}</span>
        <UpdateChecker />
        <span className="paper-footer-version">{`v${version}`}</span>
      </div>
    </footer>
  );
};

export default Footer;
