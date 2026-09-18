# 📦 Pacote Exportável: Tema Azul Live (Bingo Show)

Este pacote contém o **Tema Azul Live Oficial do Bingo Show** totalmente desacoplado, organizado e pronto para ser exportado ou importado em qualquer outro projeto que siga a arquitetura de temas desacoplada.

---

## 📂 Estrutura do Pacote

```
bingo-show-blue/
├── theme.json            # Metadados e manifesto do tema
├── README.md             # Guia de importação e documentação
│
├── assets/               # Biblioteca completa de imagens e mídias
│   ├── backgrounds/      # Fundos espaciais e gradientes (2x, 4x, dark, glow, space)
│   ├── balls/            # Texturas e artes das bolas de bingo 3D (1 a 90)
│   ├── borders/          # Bordas neon azul, dourada, vidro e efeito vencedor
│   ├── cards/            # Texturas de cartelas (vazia, marcada, premiada)
│   ├── decorative/       # Estrelas, brilhos e elementos decorativos
│   ├── effects/          # Efeitos de luz, raios, flares e iluminação neon
│   ├── icons/            # Ícones temáticos (trevo, saco de moedas, relógio, etc.)
│   ├── logos/            # Logotipos (SVG, PNG, variantes com brilho e fundo transparente)
│   ├── panels/           # Molduras de painéis, modais, headers e sidebars
│   ├── particles/        # Partículas de confete, poeira e brilhos
│   └── textures/         # Texturas de ruído, vidro e padrões
│
├── tokens/               # Código TypeScript do tema
│   ├── types.ts          # Interfaces (ThemeTokens, ThemeColors, ThemeAssets, etc.)
│   ├── colors.ts         # Paleta de cores oficial azul escuro/neon/ouro
│   ├── assets.ts         # Mapeador de caminhos estáticos
│   ├── typography.ts     # Fontes e pesos tipográficos (Barlow Condensed & Inter)
│   └── index.ts          # Exportação do objeto temaBingoShowBlue
│
└── css/                  # Estilos puros
    └── theme-blue.css    # Variáveis CSS (:root / [data-theme="blue"])
```

---

## 🚀 Como Importar Este Tema em Outro Projeto

Siga estes **4 passos simples** no projeto de destino:

### 1️⃣ Passo 1: Copiar os Assets Estáticos
Copie a pasta `assets/` deste pacote para a pasta pública do seu projeto:
```bash
public/themes/bingo-show/
```

### 2️⃣ Passo 2: Copiar ou Importar os Tokens
Copie a pasta `tokens/` para o diretório de temas do seu projeto (ex: `src/theme/` ou `lib/theme/`):
```typescript
import { temaBingoShowBlue } from "@/theme/bingo-show-blue";
// ou
import { colorsBingoShowBlue } from "@/theme/bingo-show-blue/colors";
import { bingoShowBlueAssets } from "@/theme/bingo-show-blue/assets";
```

### 3️⃣ Passo 3: Registrar no seu Seletor de Temas (`themes.ts` / `resolveTheme`)
No arquivo de resolução de temas do seu projeto:
```typescript
import { temaBingoShowBlue } from "./bingo-show-blue";

export function resolveTheme(themeInput?: any): ThemeTokens {
  const name = typeof themeInput === "string" ? themeInput.toLowerCase() : (themeInput?.id || themeInput?.name || "").toLowerCase();
  
  if (name === "blue" || name === "bingo-show-blue" || name === "live") {
    return temaBingoShowBlue;
  }
  
  return temaPadrao;
}
```

### 4️⃣ Passo 4: (Opcional) Importar as Variáveis CSS
Se o projeto utilizar CSS puro ou Tailwind com CSS Variables, importe o arquivo `css/theme-blue.css`:
```css
@import "./theme-blue.css";
```

---

## 🎨 Paleta de Cores Principal

| Propriedade | Valor | Descrição |
| :--- | :--- | :--- |
| `bgPage` | `#020617` | Fundo espacial ultra escuro |
| `bgSurface` | `rgba(3, 17, 48, 0.95)` | Superfície dos painéis e cards |
| `bgSurfaceElevated` | `#06143a` | Superfície elevada |
| `primary` | `#087FFC` | Azul elétrico vibrante |
| `primaryHover` | `#17C8FF` | Ciano neon de destaque |
| `gold` | `#FFCF12` | Dourado ouro de premiação |
| `border` | `#1975D2` | Borda azul iluminada |
| `shadowGlow` | `0 8px 24px rgba(0, 213, 255, 0.5)` | Glow neon ciano |

---

## 📜 Licença
Pacote de tema de uso exclusivo do ecossistema Bingo Show.
