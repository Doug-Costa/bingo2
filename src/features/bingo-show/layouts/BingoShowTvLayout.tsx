import React from 'react';
import { BingoShowSpacing } from '../design-system';

export interface BingoShowTvLayoutProps {
  header?: React.ReactNode;
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  footer?: React.ReactNode;
  fullBody?: React.ReactNode;
  overlay?: React.ReactNode;
  headerFlex?: number;
  mainFlex?: number;
  footerFlex?: number;
  leftFlex?: number;
  centerFlex?: number;
  rightFlex?: number;
  style?: React.CSSProperties;
}

export const BingoShowTvLayout: React.FC<BingoShowTvLayoutProps> = ({
  header,
  left,
  center,
  right,
  footer,
  fullBody,
  overlay,
  headerFlex = 0.12,
  mainFlex = 0.78,
  footerFlex = 0.1,
  leftFlex = 0.24,
  centerFlex = 0.52,
  rightFlex = 0.24,
  style,
}) => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        gap: BingoShowSpacing.sm,
        boxSizing: 'border-box',
        padding: BingoShowSpacing.sm,
        ...style,
      }}
    >
      {/* HEADER REGION */}
      {header ? (
        <div style={{ flex: headerFlex, width: '100%', minHeight: 0, overflow: 'hidden' }}>
          {header}
        </div>
      ) : null}

      {/* MAIN REGION */}
      <div style={{ flex: mainFlex, width: '100%', display: 'flex', flexDirection: 'row', gap: BingoShowSpacing.sm, minHeight: 0, overflow: 'hidden' }}>
        {fullBody ? (
          <div style={{ flex: 1, width: '100%', height: '100%', minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
            {fullBody}
          </div>
        ) : (
          <>
            {left ? <div style={{ flex: leftFlex, height: '100%', minWidth: 0, overflow: 'hidden' }}>{left}</div> : null}
            {center ? <div style={{ flex: centerFlex, height: '100%', minWidth: 0, overflow: 'hidden' }}>{center}</div> : null}
            {right ? <div style={{ flex: rightFlex, height: '100%', minWidth: 0, overflow: 'hidden' }}>{right}</div> : null}
          </>
        )}
      </div>

      {/* FOOTER REGION */}
      {footer ? (
        <div style={{ flex: footerFlex, width: '100%', minHeight: 0, overflow: 'hidden' }}>
          {footer}
        </div>
      ) : null}

      {/* OVERLAY */}
      {overlay ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 999,
            pointerEvents: 'box-none' as any,
          }}
        >
          {overlay}
        </div>
      ) : null}
    </div>
  );
};

export default BingoShowTvLayout;
