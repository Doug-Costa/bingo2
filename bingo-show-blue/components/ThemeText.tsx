"use client";

import React from "react";
import type { ThemeTokens } from "../tokens/types";

interface ThemeTextProps {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
  variant?: "heading" | "title" | "body" | "caption" | "gold" | "secondary" | "muted";
  tokens?: ThemeTokens;
  className?: string;
  style?: React.CSSProperties;
}

export function ThemeText({
  children,
  as: Component = "span",
  variant = "body",
  tokens,
  className = "",
  style = {},
}: ThemeTextProps) {
  const fontHeading = tokens?.typography.fontHeading || "'Barlow Condensed', sans-serif";
  const fontPrimary = tokens?.typography.fontPrimary || "'Inter', sans-serif";
  const textPrimary = tokens?.colors.textPrimary || "#F8FBFF";
  const textSecondary = tokens?.colors.textSecondary || "#AEBBD8";
  const textMuted = tokens?.colors.textMuted || "#64748B";
  const goldColor = tokens?.colors.gold || "#FFCF12";
  const goldDark = tokens?.colors.goldDark || "#FFD54F";

  const variantStyles: Record<string, React.CSSProperties> = {
    heading: {
      fontFamily: fontHeading,
      fontWeight: 900,
      fontSize: "32px",
      textTransform: "uppercase",
      color: textPrimary,
      letterSpacing: "0.5px",
    },
    title: {
      fontFamily: fontHeading,
      fontWeight: 700,
      fontSize: "22px",
      color: textPrimary,
    },
    body: {
      fontFamily: fontPrimary,
      fontWeight: 400,
      fontSize: "15px",
      color: textPrimary,
    },
    secondary: {
      fontFamily: fontPrimary,
      fontWeight: 500,
      fontSize: "14px",
      color: textSecondary,
    },
    muted: {
      fontFamily: fontPrimary,
      fontWeight: 400,
      fontSize: "13px",
      color: textMuted,
    },
    gold: {
      fontFamily: fontHeading,
      fontWeight: 900,
      color: goldColor,
      textShadow: `0 0 12px ${goldDark}`,
    },
    caption: {
      fontFamily: fontPrimary,
      fontWeight: 600,
      fontSize: "11px",
      textTransform: "uppercase",
      letterSpacing: "1px",
      color: textMuted,
    },
  };

  return (
    <Component
      className={`theme-text theme-text-${variant} ${className}`}
      style={{
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </Component>
  );
}
