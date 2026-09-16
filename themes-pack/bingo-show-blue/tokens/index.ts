import { ThemeTokens } from "./types";
import { colorsBingoShowBlue } from "./colors";
import { bingoShowBlueAssets, createBingoShowAssets } from "./assets";
import { typographyBingoShowBlue } from "./typography";

export * from "./types";
export * from "./assets";
export * from "./colors";
export * from "./typography";

export const temaBingoShowBlue: ThemeTokens = {
  id: "bingo-show-blue",
  name: "Tema Azul Live",
  icon: "🌌",
  description: "Tema clássico e imersivo da sala ao vivo com estética espacial neon e detalhes dourados.",
  mode: "dark",
  colors: colorsBingoShowBlue,
  assets: bingoShowBlueAssets,
  typography: typographyBingoShowBlue,
};

/**
 * Função factory para instanciar o tema azul com caminho customizado de assets se necessário.
 */
export function createTemaBingoShowBlue(customBasePath?: string): ThemeTokens {
  return {
    ...temaBingoShowBlue,
    assets: customBasePath ? createBingoShowAssets(customBasePath) : bingoShowBlueAssets,
  };
}

export default temaBingoShowBlue;
