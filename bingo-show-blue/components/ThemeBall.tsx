"use client";

import React from "react";
import type { ThemeTokens } from "../tokens/types";

interface ThemeBallProps {
  number: number | string;
  size?: number;
  colorVariant?: "gold" | "blue" | "red" | "purple" | "cyan" | "green" | "auto";
  active?: boolean;
  tokens?: ThemeTokens;
  className?: string;
  style?: React.CSSProperties;
}

export function ThemeBall({
  number,
  size = 64,
  colorVariant = "auto",
  active = true,
  tokens,
  className = "",
  style = {},
}: ThemeBallProps) {
  const numVal = typeof number === "number" ? number : parseInt(String(number), 10);
  const resolvedVariant = colorVariant === "auto" ? getBallVariantByNumber(numVal) : colorVariant;

  const goldColor = tokens?.colors.gold || "#FFCF12";
  const cyanColor = tokens?.colors.cyan || "#17c8ff";
  const redColor = tokens?.colors.red || "#E52B21";
  const purpleColor = tokens?.colors.purple || "#A855F7";
  const greenColor = tokens?.colors.green || "#34D399";
  const fontHeading = tokens?.typography.fontHeading || "'Barlow Condensed', sans-serif";

  const gradientMap: Record<string, { bg: string; color: string; glow: string }> = {
    gold: {
      bg: "radial-gradient(circle at 35% 25%, #fff095, #f6b906 48%, #8a5200)",
      color: "#ffffff",
      glow: goldColor,
    },
    blue: {
      bg: "radial-gradient(circle at 35% 25%, #6de8ff, #087ffc 48%, #032d88)",
      color: "#ffffff",
      glow: cyanColor,
    },
    red: {
      bg: "radial-gradient(circle at 35% 25%, #ff8b79, #e52b21 48%, #761006)",
      color: "#ffffff",
      glow: redColor,
    },
    purple: {
      bg: "radial-gradient(circle at 35% 25%, #dc9cff, #8e35db 48%, #43116e)",
      color: "#ffffff",
      glow: purpleColor,
    },
    cyan: {
      bg: "radial-gradient(circle at 35% 25%, #a5f3fc, #06b6d4 48%, #0e7490)",
      color: "#ffffff",
      glow: cyanColor,
    },
    green: {
      bg: "radial-gradient(circle at 35% 25%, #86efac, #10b981 48%, #064e3b)",
      color: "#ffffff",
      glow: greenColor,
    },
  };

  const scheme = gradientMap[resolvedVariant] || gradientMap.blue;

  return (
    <div
      className={`theme-ball ${resolvedVariant} ${active ? "active" : "inactive"} ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        background: scheme.bg,
        color: scheme.color,
        fontFamily: fontHeading,
        fontWeight: 900,
        fontSize: `${Math.round(size * 0.48)}px`,
        border: "2px solid rgba(255, 255, 255, 0.8)",
        boxShadow: active
          ? `inset -6px -8px 10px rgba(0, 0, 0, 0.3), inset 6px 6px 8px rgba(255, 255, 255, 0.45), 0 0 ${Math.round(size * 0.25)}px ${scheme.glow}`
          : "inset -4px -6px 8px rgba(0, 0, 0, 0.4)",
        textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
        userSelect: "none",
        opacity: active ? 1 : 0.4,
        transform: active ? "scale(1)" : "scale(0.92)",
        transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
        ...style,
      }}
    >
      <span>{number}</span>
    </div>
  );
}

function getBallVariantByNumber(num: number): "blue" | "red" | "gold" | "purple" | "green" {
  if (isNaN(num)) return "blue";
  if (num <= 18) return "blue";
  if (num <= 36) return "red";
  if (num <= 54) return "gold";
  if (num <= 72) return "purple";
  return "green";
}
