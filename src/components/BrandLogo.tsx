import React from "react";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

const sizeClasses = {
  sm: {
    brand: "text-sm",
    tagline: "text-[10px]",
  },
  md: {
    brand: "text-base",
    tagline: "text-[11px]",
  },
  lg: {
    brand: "text-2xl",
    tagline: "text-xs",
  },
} as const;

const BRAND_NAME = "MadWhisp";
const BRAND_TAGLINE = "madera.tools";

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = "",
  size = "md",
  showTagline = true,
}) => {
  const classes = sizeClasses[size];

  return (
    <div className={`font-mono leading-none ${className}`}>
      <div
        className={`${classes.brand} font-bold tracking-normal text-logo-primary`}
      >
        <span className="text-mid-gray">&gt;</span> <span>{BRAND_NAME}</span>
        <span className="ml-1 animate-pulse text-logo-primary">_</span>
      </div>
      {showTagline && (
        <div className={`${classes.tagline} mt-2 text-mid-gray`}>
          {BRAND_TAGLINE}
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
