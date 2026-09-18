# 📋 ESPECIFICAÇÕES TÉCNICAS E DE DESIGN DO TEMA
## **Bingo Show — Tema Azul Live (Oficial)**

---

### 📌 1. Visão Geral e Identidade do Tema

O **Bingo Show — Tema Azul Live** é o pacote visual oficial projetado para proporcionar uma experiência imersiva de cassino e arena de transmissão ao vivo (TV, Desktop, Tablet e Mobile).

- **Identificador Único (`id`):** `bingo-show-blue`
- **Nome Oficial:** Bingo Show - Tema Azul Live (Padrão)
- **Modo:** `dark` (Tema Escuro Espacial com Iluminação Neon)
- **Caminho Base Padrão de Assets:** `/themes/bingo-show/`
- **Versão:** `1.0.0`

---

### 🎨 2. Paleta de Cores e Tokens Visuais

A paleta combina o azul espacial ultra-escuro de fundo com detalhes neon ciano e azul elétrico para os elementos de controle e interfaces, realçados pelo **ouro metálico** para prêmios, linhas e o grande acumulado (Jackpot).

#### 2.1. Tabela de Cores Principais

| Token | Hexadecimal | RGB / RGBA | Finalidade / Aplicação |
| :--- | :--- | :--- | :--- |
| **`bgPage`** | `#020617` | `rgb(2, 6, 23)` | Fundo geral da página e do aplicativo |
| **`bgSurface`** | `rgba(3, 17, 48, 0.95)` | `rgba(3, 17, 48, 0.95)` | Superfície padrão de cards, painéis e modais |
| **`bgSurfaceElevated`** | `#06143a` | `rgb(6, 20, 58)` | Superfícies com elevação superior ou destaque |
| **`primary`** | `#087FFC` | `rgb(8, 127, 252)` | Cor primária da marca e botões de ação principal |
| **`primaryHover`** | `#17C8FF` | `rgb(23, 200, 255)` | Estado de hover primário e destaques de foco |
| **`primaryLight`** | `rgba(8, 127, 252, 0.2)` | `rgba(8, 127, 252, 0.2)` | Fundos sutis, pills e tags de status |
| **`gold`** | `#FFCF12` | `rgb(255, 207, 18)` | Premiações, jackpot, troféus e badges |
| **`goldDark`** | `#FFD54F` | `rgb(255, 213, 79)` | Glow dourado e sombras de texto de vitória |
| **`cyan`** | `#17C8FF` | `rgb(23, 200, 255)` | Elementos neon, contornos ativos e partículas |
| **`purple`** | `#A855F7` | `rgb(168, 85, 247)` | Bolas da faixa 4 (G) e eventos especiais |
| **`coral`** | `#FF6B6B` | `rgb(255, 107, 107)` | Notificações quentes e bolas da faixa 2 |
| **`red`** | `#E52B21` | `rgb(229, 43, 33)` | Alertas de urgência, faltam 1/2 e bolas vermelhas |
| **`green`** | `#34D399` | `rgb(52, 211, 153)` | Sucesso, status conectado ao vivo e saldo |
| **`border`** | `#1975D2` | `rgb(25, 117, 210)` | Bordas de painéis, caixas de diálogo e inputs |
| **`textPrimary`** | `#F8FBFF` | `rgb(248, 251, 255)` | Texto principal com máximo contraste |
| **`textSecondary`** | `#AEBBD8` | `rgb(174, 187, 216)` | Rótulos secundários, subtítulos e instruções |
| **`textMuted`** | `#64748B` | `rgb(100, 116, 139)` | Textos desativados e legendas menores |

#### 2.2. Sombras e Efeitos Neon (Glow)

- **`shadowSubtle`:** `0 4px 20px rgba(0, 129, 255, 0.18)`
- **`shadowCard`:** `0 8px 30px rgba(0, 129, 255, 0.25)`
- **`shadowHover`:** `0 14px 40px rgba(0, 213, 255, 0.4)`
- **`shadowGlow`:** `0 8px 24px rgba(0, 213, 255, 0.5)`
- **`shadowGold`:** `0 0 25px rgba(255, 207, 18, 0.6)`

---

### 🔤 3. Especificações Tipográficas

O tema utiliza duas famílias de fontes que se complementam entre dinamismo esportivo/cassino e legibilidade digital:

| Tipo | Família de Fonte | Pesos Recomendados | Uso |
| :--- | :--- | :--- | :--- |
| **Headings / TV** | `'Barlow Condensed', sans-serif` | `700 (Bold)`, `900 (Black)` | Títulos, placar, números de bolas, cupons e contadores |
| **Corpo e Interface** | `'Inter', system-ui, sans-serif` | `400 (Regular)`, `500 (Medium)`, `600 (SemiBold)` | Textos informativos, botões, modais, formulários e tabelas |

#### 3.1. Escala de Tamanhos Recomendada

- **Hero / Placar Principal:** `48px – 64px` (Line Height: `1.0`, Weight: `900`)
- **Títulos de Painéis (h2):** `22px – 28px` (Line Height: `1.2`, Weight: `800`)
- **Subtítulos e Badges:** `14px – 16px` (Line Height: `1.3`, Weight: `700`)
- **Corpo de Texto (Body):** `14px – 15px` (Line Height: `1.5`, Weight: `400`)
- **Legendas e Captions:** `11px – 12px` (Letter Spacing: `1px`, Text-Transform: `uppercase`, Weight: `600`)

---

### 🖼️ 4. Catálogo e Especificações de Assets Gráficos

Todos os assets estão organizados sob o diretório `assets/` e possuem versões de alta fidelidade:

```
assets/
├── backgrounds/         # Fundos imersivos em alta definição
├── balls/               # Bolas 3D numeradas de 1 a 90
├── borders/             # Molduras com efeitos de brilho neon e dourado
├── cards/               # Cartelas de bingo em diferentes estados
├── decorative/          # Elementos de composição (brilhos, estrelas)
├── effects/             # Efeitos visuais de iluminação e raios
├── icons/               # Ícones 3D temáticos (trevo, ampulheta, etc.)
├── logos/               # Logotipos em PNG e SVG com variantes
├── panels/              # Molduras de painéis de vidro e headers
├── particles/           # Partículas de confetes e poeira brilhante
├── textures/            # Texturas de ruído suave e reflexos
└── *.png/*.jpg          # Imagens isoladas principais
```

#### 4.1. Detalhamento das Categorias de Assets

| Diretório / Asset | Formato | Dimensões Ideais | Descrição Técnica |
| :--- | :--- | :--- | :--- |
| `backgrounds/` | `.png` / `.webp` | `1920x1080` / `3840x2160` | Fundo espacial cósmico escuro com nebulosas azuis |
| `balls/` | `.png` | `256x256` (1:1) | Bolas 3D de 1 a 90 com textura esférica e reflexo radial |
| `borders/` | `.png` / `.svg` | Vetorial / `1024x512` | Molduras neon azul e dourada com cantos arredondados |
| `cards/` | `.png` | `600x400` | Texturas de cartelas (vazia, marcada e premiada) |
| `icons/` | `.png` | `128x128` a `256x256` | Trevo de 4 folhas 3D, ampulheta dourada, relógio, moedas |
| `logos/` | `.svg` / `.png` | Vetorial / `512x180` | Logotipo oficial Bingo Show com versões transparente e glow |
| `panels/` | `.png` | `1200x800` | Fundos translúcidos para modal, sidebar, ranking e grade 90 |
| `bingo-cage.jpg` | `.jpg` | `800x600` | Fotografia realista do Globo de Bingo Dourado |
| `relogio_areia.png` | `.png` | `256x256` | Ícone translúcido da ampulheta de contagem regressiva |
| `trevo.png` | `.png` | `256x256` | Ícone 3D do Trevo de 4 folhas da Sorte |

---

### 🧩 5. Componentes Visuais do Tema (React / TSX)

O pacote inclui 6 componentes modulares com suporte automático a tokens:

#### 1. `<ThemeBackground />`
Fundo dinâmico com suporte a overlay escuro e efeito de desfoque (`backdrop-filter`).
- **Variantes:** `"main" | "dark" | "glow" | "blueGradient" | "space"`
- **Props:** `showOverlay?: boolean`, `tokens?: ThemeTokens`, `className?: string`

#### 2. `<ThemePanel />`
Painel container com borda neon e sombra customizada para seções da aplicação.
- **Variantes:** `"main" | "glass" | "neon" | "dark" | "header" | "footer" | "modal" | "sidebar"`
- **Props:** `bordered?: boolean`, `glow?: boolean`, `tokens?: ThemeTokens`

#### 3. `<ThemeCard />`
Cartela de bingo com tratamento para estados padrão, marcado e vencedor.
- **Variantes:** `"default" | "marked" | "winner"`
- **Props:** `tokens?: ThemeTokens`, `onClick?: () => void`

#### 4. `<ThemeBall />`
Bola de bingo esférica realista com gradientes radiais nativos em CSS e glow.
- **Variantes de Cor:** `"auto" | "gold" | "blue" | "red" | "purple" | "cyan" | "green"`
- **Props:** `number: number | string`, `size?: number` (padrão: `64px`), `active?: boolean`

#### 5. `<ThemeLogo />`
Logotipo com fallback em texto estilizado caso a imagem falhe ao carregar.
- **Variantes:** `"main" | "blue" | "gold" | "glow" | "transparent"`
- **Props:** `width?: number | string`, `height?: number | string`, `alt?: string`

#### 6. `<ThemeText />`
Tipografia padronizada em conformidade com as regras tipográficas do tema.
- **Variantes:** `"heading" | "title" | "body" | "caption" | "gold" | "secondary" | "muted"`
- **Tag Renderizada:** `as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div"`

---

### 🎬 6. Animações e Efeitos Especiais (Keyframes)

1. **Jumping Ball Arc:** Arco parabólico de projeção quando uma nova bola é sorteada do globo.
2. **Neon Pulse:** Pulsação periódica no brilho das bordas dos prêmios e do jackpot.
3. **Coin Rain:** Chuva de 24 moedas de ouro girando em 3D sobreposta quando uma linha ou bingo é alcançado.
4. **Stack Shifting:** Transição suave da fila das últimas 3 bolas sorteadas.

---

### 📦 7. Estrutura de Arquivos no Pacote

```
bingo-show-blue/
├── theme.json              # Manifesto oficial de metadados
├── README.md               # Guia de início rápido e importação
├── ESPECIFICACOES.md       # Esta especificação técnica completa
│
├── assets/                 # Mídias e imagens em alta resolução
│   ├── backgrounds/
│   ├── balls/
│   ├── borders/
│   ├── cards/
│   ├── decorative/
│   ├── effects/
│   ├── icons/
│   ├── logos/
│   ├── panels/
│   ├── particles/
│   ├── textures/
│   ├── bingo-cage.jpg
│   ├── relogio_areia.png
│   └── trevo.png
│
├── tokens/                 # Design tokens em TypeScript
│   ├── types.ts            # Interfaces tipadas
│   ├── colors.ts           # Paleta oficial
│   ├── assets.ts           # Mapeador de caminhos estáticos
│   ├── typography.ts       # Configurações de fontes
│   └── index.ts            # Exportação unificada
│
├── components/             # Componentes React (TSX)
│   ├── ThemeBackground.tsx
│   ├── ThemePanel.tsx
│   ├── ThemeCard.tsx
│   ├── ThemeBall.tsx
│   ├── ThemeLogo.tsx
│   ├── ThemeText.tsx
│   └── index.ts
│
└── css/                    # Variáveis CSS globais
    └── theme-blue.css
```

---

### 🚀 8. Instruções de Integração

Para instalar este tema em qualquer novo projeto web:
1. Copie a pasta `assets/` para `public/themes/bingo-show/`.
2. Copie `tokens/` e `components/` para a estrutura de código-fonte do seu projeto.
3. Importe `css/theme-blue.css` no ponto de entrada global de estilos.
4. Use os componentes `<ThemeBackground>`, `<ThemeBall>`, `<ThemePanel>` e o hook `useThemeTokens()`.
