import re

def update_file():
    filepath = '/Users/cliente/Documents/tvapp.next/bingo-show-next/src/features/bingo-show/components/BingoShowWinnerPopup.tsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add getPrizeDisplay
    get_prize_func = """
function getPrizeDisplay(type?: string) {
  const norm = normalizeWinnerType(type) || 'bingo';
  if (norm === 'line1') return { order: '1º PRÊMIO', title: '1 LINHA', full: '1º PRÊMIO • 1 LINHA' };
  if (norm === 'line2') return { order: '2º PRÊMIO', title: '2 LINHAS', full: '2º PRÊMIO • 2 LINHAS' };
  return { order: '3º PRÊMIO', title: 'BINGO', full: '3º PRÊMIO • BINGO' };
}
"""
    content = content.replace("function normalizeWinnerType", get_prize_func + "\nfunction normalizeWinnerType")

    # 2. WinnerCard Re-layout
    old_winner_card = """      {/* LADO ESQUERDO: DADOS DO JOGADOR + VALOR INDIVIDUAL + JACKPOT SEPARADO */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', minWidth: 0 }}>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          {/* IDENTIFICADOR DO GANHADOR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <BingoShowIcon name="winner" size={compact ? 16 : 22} color={isJackpot ? '#FFD700' : themeColor} transparentBg />
            <span
              style={{
                fontSize: compact ? 16 : 22,
                fontWeight: 900,
                color: isJackpot ? '#FFD700' : themeColor,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              {isSplit ? `GANHADOR ${splitIndex + 1}/${totalSplitCount}` : 'GANHADOR CONTEMPLADO'}
            </span>
          </div>

          {/* NOME DO JOGADOR (Fonte responsiva sem inventar nome fictício) */}
          <span
            style={{
              fontSize: compact ? 26 : 38,
              fontWeight: 900,
              color: '#FFFFFF',
              lineHeight: 1.1,
              whiteSpace: 'normal',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              width: '100%',
            }}
          >
            {displayName}
          </span>

          {/* CÓDIGO DO CUPOM DA SORTE */}
          <span
            style={{
              fontSize: compact ? 13 : 20,
              fontWeight: 800,
              color: 'rgba(255, 255, 255, 0.75)',
              letterSpacing: 1,
              marginTop: 2,
            }}
          >
            CUPOM: <strong style={{ color: themeColor }}>{formattedTicket}</strong>
          </span>
        </div>

        {/* VALOR INDIVIDUAL DO GANHADOR */}
        <div style={{ marginTop: compact ? 4 : 8 }}>
          <span style={{ fontSize: compact ? 13 : 16, fontWeight: 700, color: 'rgba(255, 255, 255, 0.6)', letterSpacing: 1, textTransform: 'uppercase', display: 'block' }}>
            PRÊMIO DO GANHADOR
          </span>"""

    new_winner_card = """      {/* LADO ESQUERDO: DADOS DO JOGADOR + VALOR INDIVIDUAL + JACKPOT SEPARADO */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: compact ? 12 : 28, height: '100%', minWidth: 0 }}>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          {/* IDENTIFICADOR E CUPOM NA MESMA LINHA NO TOPO */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: compact ? 4 : 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <BingoShowIcon name="winner" size={compact ? 16 : 22} color={isJackpot ? '#FFD700' : themeColor} transparentBg />
              <span
                style={{
                  fontSize: compact ? 16 : 22,
                  fontWeight: 900,
                  color: isJackpot ? '#FFD700' : themeColor,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}
              >
                {isSplit ? `GANHADOR ${splitIndex + 1}/${totalSplitCount}` : 'GANHADOR CONTEMPLADO'}
              </span>
            </div>
            {formattedTicket && (
              <span
                style={{
                  fontSize: compact ? 12 : 14,
                  fontWeight: 900,
                  color: themeColor,
                  letterSpacing: 1,
                }}
              >
                CUPOM {formattedTicket}
              </span>
            )}
          </div>

          {/* NOME DO JOGADOR */}
          <span
            style={{
              fontSize: compact ? 24 : 32,
              fontWeight: 900,
              color: '#FFFFFF',
              lineHeight: 1.1,
              whiteSpace: 'normal',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              width: '100%',
            }}
          >
            {displayName}
          </span>
        </div>

        {/* VALOR INDIVIDUAL DO GANHADOR */}
        <div style={{ marginTop: compact ? 4 : 8 }}>
          <span style={{ fontSize: compact ? 13 : 16, fontWeight: 700, color: 'rgba(255, 255, 255, 0.6)', letterSpacing: 1, textTransform: 'uppercase', display: 'block' }}>
            {isSplit ? 'PRÊMIO INDIVIDUAL' : 'PRÊMIO DO GANHADOR'}
          </span>"""
    
    content = content.replace(old_winner_card, new_winner_card)

    # 3. ItemsPerPage
    content = content.replace("const itemsPerPage = 4;", "const itemsPerPage = isHero ? 4 : 2;")
    content = content.replace("const pagesLine1 = Math.ceil(line1Winners.length / itemsPerPage) || 1;\n  const pagesLine2 = Math.ceil(line2Winners.length / itemsPerPage) || 1;", "const pagesLine1 = Math.ceil(line1Winners.length / 2) || 1;\n  const pagesLine2 = Math.ceil(line2Winners.length / 2) || 1;")
    content = content.replace("const pagesBingo = Math.ceil(bingoWinners.length / itemsPerPage) || 1;", "const pagesBingo = Math.ceil(bingoWinners.length / 4) || 1;")

    # 4. CategoryWinnerBlock header
    old_badge = """          <BingoShowBadge
            label={hasJackpotInCategory ? `💎 ${title} + JACKPOT` : title}
            variant={badgeVariant}
            style={{ padding: isHero ? '10px 24px' : '6px 18px', fontSize: isHero ? 22 : 18 }}
          />"""
    
    new_badge = """          <div
            style={{
              backgroundColor: badgeVariant === 'gold' ? 'rgba(255, 222, 56, 0.15)' : badgeVariant === 'cyan' ? 'rgba(0, 229, 255, 0.15)' : 'rgba(0, 255, 136, 0.15)',
              border: `2px solid ${themeColor}`,
              borderRadius: 12,
              padding: isHero ? '8px 24px' : '6px 18px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: isHero ? 20 : 16, fontWeight: 900, color: themeColor, textTransform: 'uppercase', letterSpacing: 1 }}>
              {hasJackpotInCategory ? `💎 ${getPrizeDisplay(categoryKey).full} + JACKPOT` : getPrizeDisplay(categoryKey).full}
            </span>
            <span style={{ fontSize: isHero ? 15 : 13, fontWeight: 800, color: 'rgba(255, 255, 255, 0.85)', letterSpacing: 1 }}>
              FAIXA • {defaultPrizeStr}
            </span>
          </div>"""
    
    content = content.replace(old_badge, new_badge)

    # 5. Grid in CategoryWinnerBlock
    old_grid = """            <div
              style={{
                display: 'grid',
                width: '100%',
                gridTemplateColumns: currentPageWinners.length > 1 ? 'repeat(2, 1fr)' : '1fr',
                gridTemplateRows: currentPageWinners.length > 2 ? 'repeat(2, 1fr)' : '1fr',
                gap: 8,
                minHeight: 0,
              }}
            >"""
    new_grid = """            <div
              style={{
                display: 'grid',
                width: '100%',
                gridTemplateColumns: isHero && currentPageWinners.length > 1 ? 'repeat(2, 1fr)' : '1fr',
                gridTemplateRows: currentPageWinners.length > (isHero ? 2 : 1) ? 'repeat(2, 1fr)' : '1fr',
                gap: 8,
                minHeight: 0,
              }}
            >"""
    content = content.replace(old_grid, new_grid)

    # 6. Individual Popup Title
    old_single_title = """          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 12 }}>
            <BingoShowBadge label={`GANHADOR • ${normType.toUpperCase()}`} variant={normType === 'line1' ? 'gold' : normType === 'line2' ? 'cyan' : 'green'} style={{ padding: '14px 38px', fontSize: 28 }} />
          </div>"""
    new_single_title = """          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 12 }}>
            <BingoShowBadge label={getPrizeDisplay(normType).full} variant={normType === 'line1' ? 'gold' : normType === 'line2' ? 'cyan' : 'green'} style={{ padding: '14px 38px', fontSize: 28 }} />
          </div>"""
    content = content.replace(old_single_title, new_single_title)

    # 7. Use getPrizeDisplay titles in main layout
    content = content.replace('title="1 LINHA"', 'title={getPrizeDisplay(\'line1\').title}')
    content = content.replace('title="2 LINHAS"', 'title={getPrizeDisplay(\'line2\').title}')
    content = content.replace('title="BINGO"', 'title={getPrizeDisplay(\'bingo\').title}')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print("File updated successfully.")

if __name__ == '__main__':
    update_file()
