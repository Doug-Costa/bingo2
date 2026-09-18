"use client";

import React from "react";
import type { ThemeTokens } from "../tokens/types";

interface ThemePanelProps {
  children: React.ReactNode;
  variant?: "main" | "glass" | "neon" | "dark" | "header" | "footer" | "modal" | "popup" | "sidebar";
  tokens?: ThemeTokens;
  bordered?: boolean;
  glow?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function ThemePanel({
  children,
  variant = "main",
  tokens,
  bordered = true,
  glow = false,
  className = "",
  style = {},
}: ThemePanelProps) {
  const panelBgAsset = tokens?.assets.panels[variant];
  const bgSurface = tokens?.colors.bgSurface || "rgba(3, 17, 48, 0.95)";
  const borderColor = tokens?.colors.border || "#1975D2";
  const textColor = tokens?.colors.textPrimary || "#F8FBFF";
  const shadowGlow = tokens?.colors.shadowGlow || "0 8px 24px rgba(0, 213, 255, 0.5)";
  const shadowCard = tokens?.colors.shadowCard || "0 8px 30px rgba(0, 129, 255, 0.25)";

  const defaultBorder = bordered ? `1px solid ${borderColor}` : "none";
  const defaultShadow = glow ? shadowGlow : shadowCard;

  return (
    <div
      className={`theme-panel ${className}`}
      style={{
        backgroundColor: bgSurface,
        backgroundImage: panelBgAsset ? `url(${panelBgAsset})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        border: defaultBorder,
        borderRadius: "16px",
        boxShadow: defaultShadow,
        color: textColor,
        padding: "16px",
        transition: "all 0.25s ease",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
