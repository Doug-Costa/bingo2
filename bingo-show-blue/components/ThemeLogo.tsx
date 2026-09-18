"use client";

import React, { useState } from "react";
import type { ThemeTokens } from "../tokens/types";

interface ThemeLogoProps {
  variant?: "main" | "blue" | "gold" | "glow" | "transparent";
  tokens?: ThemeTokens;
  width?: number | string;
  height?: number | string;
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
}

export function ThemeLogo({
  variant = "main",
  tokens,
  width = 160,
  height = "auto",
  className = "",
  alt = "Bingo Show",
  style = {},
}: ThemeLogoProps) {
  const [hasError, setHasError] = useState(false);

  let logoSrc = tokens?.assets.logos.main || "/themes/bingo-show/logos/logo-main.png";
  if (variant === "blue" && tokens?.assets.logos.blueSvg) logoSrc = tokens.assets.logos.blueSvg;
  if (variant === "gold" && tokens?.assets.logos.goldSvg) logoSrc = tokens.assets.logos.goldSvg;
  if (variant === "glow" && tokens?.assets.logos.glow) logoSrc = tokens.assets.logos.glow;
  if (variant === "transparent" && tokens?.assets.logos.transparent) logoSrc = tokens.assets.logos.transparent;

  const fontHeading = tokens?.typography.fontHeading || "'Barlow Condensed', sans-serif";
  const goldColor = tokens?.colors.gold || "#FFCF12";
  const primaryColor = tokens?.colors.primary || "#087FFC";
  const cyanColor = tokens?.colors.cyan || "#17c8ff";

  if (hasError) {
    return (
      <div
        className={`theme-logo-fallback ${className}`}
        style={{
          fontFamily: fontHeading,
          fontWeight: 900,
          fontSize: "26px",
          color: goldColor,
          textShadow: `0 0 10px ${primaryColor}`,
          letterSpacing: "1px",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          ...style,
        }}
      >
        <span>BINGO</span>
        <span style={{ color: cyanColor }}>SHOW</span>
      </div>
    );
  }

  return (
    <img
      src={logoSrc}
      alt={alt}
      width={width}
      height={height}
      className={`theme-logo-img ${className}`}
      onError={() => setHasError(true)}
      style={{
        display: "block",
        maxWidth: "100%",
        height: height === "auto" ? "auto" : `${height}px`,
        objectFit: "contain",
        ...style,
      }}
    />
  );
}
