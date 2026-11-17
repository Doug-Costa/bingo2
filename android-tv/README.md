# Bingo Show TV — APK Android TV

App nativo mínimo (uma tela com WebView, sem dependências) que abre o site
hospedado. O site é carregado da internet, então publicar uma nova versão dele
atualiza a TV sem precisar reinstalar o APK.

## O que cada arquivo faz

- `app/src/main/assets/tv-remote.js` — navegação pelo controle, injetada em todas
  as páginas: setas, OK, teclas numéricas e sinal de vida.
- `app/src/main/java/com/bingoshow/tv/MainActivity.java` — WebView, recuperação de
  falhas e menu do botão Voltar.
- `gradle.properties` — `tvUrl`, o endereço que o app abre.

## Controle remoto

| Tecla | Ação |
| --- | --- |
| Setas | Move o foco (anel amarelo) |
| OK | Clica; em campo de texto, abre o teclado da TV |
| 0–9 e apagar | Digitam o PIN |
| Voltar ou Menu | Continuar, Recarregar, Trocar PIN / servidor, Sair |

Na tela do jogo, a primeira tecla mostra o seletor de idioma, e o anel de foco
some depois de 10 segundos sem usar o controle.

## Recuperação de falhas

- Sem internet ou servidor fora do ar: mostra aviso e tenta de novo a cada 5s.
- Processo do WebView morreu (falta de memória): recria o WebView, sem fechar o app.
- Página travada (60s sem sinal de vida): recria o WebView.

## Publicar uma nova versão

As ferramentas ficam em `~/android-build` (JDK 17, Android SDK, Gradle).

Os dados do R2 ficam em `deploy.env`. Se as chaves S3 (Access Key e Secret Key)
ainda não estiverem preenchidas, o script pede na tela e salva nesse arquivo. Para
trocá-las, rode `./deploy.sh --trocar-chaves`. A chave precisa de permissão
"Object Read & Write" no bucket.

```bash
./deploy.sh
```

O script aumenta a versão, compila, envia ao R2 e confere o link público. No fim,
mostra o link fixo para a primeira instalação. Se falhar, a versão não avança.

No bucket, `tv.apk` fica na raiz: é o endereço curto para digitar na TV, sempre com
a versão mais recente. O resto fica em `tv-apk/`: `version.json`, o APK de cada
versão e `bingo-show-tv.apk`, também o mais recente. O `version.json` é o endereço
que os apps instalados consultam, então não pode mudar de lugar.

## Atualização nas TVs

O app verifica o `version.json` 20 segundos depois de abrir e a cada 6 horas. Se
houver versão nova, baixa em segundo plano, confere o SHA-256 e mostra
"Atualizar agora / Depois". O Android não permite que um app comum se instale sem
confirmação, então a tela de instalação do sistema sempre pede um OK.

Na primeira atualização, o Android 8 ou superior pede para liberar o app como
fonte de instalação. Só um APK gerado pelo `deploy.sh` procura atualizações.

## Chave de assinatura

`keystore/` guarda a chave e a senha do app, e não vai para o git nem para a
Vercel. **Faça uma cópia de segurança dessa pasta.** Sem ela, as próximas versões
não instalam por cima da atual: é preciso desinstalar o app, o que apaga o PIN
salvo na TV.
