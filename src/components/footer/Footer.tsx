import React, { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";

import ModelSelector from "../model-selector";
import UpdateChecker from "../update-checker";

const PRODUCT_NAME = "MotsDits";

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
    <div className="w-full border-t border-logo-stroke/30 bg-[#080c10] pt-3">
      <div className="flex justify-between items-center text-xs px-4 pb-3 text-text/70 font-mono">
        <div className="flex items-center gap-4">
          <ModelSelector />
        </div>

        <div className="flex items-center gap-1">
          <span className="text-logo-primary">{PRODUCT_NAME}</span>
          <span>|</span>
          <UpdateChecker />
          <span>|</span>
          <span>{`v${version}`}</span>
        </div>
      </div>
    </div>
  );
};

export default Footer;
