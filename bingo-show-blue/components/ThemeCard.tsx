"use client";

import React from "react";
import type { ThemeTokens } from "../tokens/types";

interface ThemeCardProps {
  children: React.ReactNode;
  variant?: "default" | "marked" | "winner";
  tokens?: ThemeTokens;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function ThemeCard({
  children,
  variant = "default",
  tokens,
  className = "",
  style = {},
  onClick,
}: ThemeCardProps) {
  const cardBgAsset = 
    variant === "winner" ? tokens?.assets.cards.cardWinner :
    variant === "marked" ? tokens?.assets.cards.cardMarked :
    tokens?.assets.cards.cardEmpty;

  const bgSurface = tokens?.colors.bgSurface || "rgba(3, 17, 48, 0.95)";
  const goldColor = tokens?.colors.gold || "#FFCF12";
  const primaryColor = tokens?.colors.primary || "#087FFC";
  const borderColor = tokens?.colors.border || "#1975D2";
  const textColor = tokens?.colors.textPrimary || "#F8FBFF";
  const shadowGlow = tokens?.colors.shadowGlow || "0 8px 24px rgba(0, 213, 255, 0.5)";
  const shadowSubtle = tokens?.colors.shadowSubtle || "0 4px 20px rgba(0, 129, 255, 0.18)";

  const resolvedBorderColor = 
    variant === "winner" ? goldColor :
    variant === "marked" ? primaryColor :
    borderColor;

  return (
    <div
      className={`theme-card ${variant} ${className}`}
      onClick={onClick}
      style={{
        backgroundColor: bgSurface,
        backgroundImage: cardBgAsset ? `url(${cardBgAsset})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        border: `2px solid ${resolvedBorderColor}`,
        borderRadius: "14px",
        boxShadow: variant === "winner" ? shadowGlow : shadowSubtle,
        color: textColor,
        padding: "12px",
        position: "relative",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
