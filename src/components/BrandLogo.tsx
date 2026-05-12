import React from "react";
import logoUrl from "../assets/motsdits-logo.png";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizePixels: Record<"sm" | "md" | "lg", number> = {
  sm: 56,
  md: 96,
  lg: 168,
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = "",
  size = "md",
}) => {
  const dim = sizePixels[size];

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img
        src={logoUrl}
        alt="MotsDits"
        width={dim}
        height={dim}
        draggable={false}
        className="select-none"
        style={{ width: dim, height: dim }}
      />
    </div>
  );
};

export default BrandLogo;
