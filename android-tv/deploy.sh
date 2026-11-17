#!/usr/bin/env bash
# Compila uma nova versão do APK e publica no R2. As TVs encontram a versão nova
# pelo version.json. Uso: ./deploy.sh
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${DEPLOY_ENV:-$DIR/deploy.env}"
PREFIX="tv-apk"
SHORT_APK="tv.apk" # na raiz do bucket: endereço curto para digitar na TV
TOOLS="${ANDROID_BUILD_DIR:-$HOME/android-build}"

die() { echo "ERRO: $*" >&2; exit 1; }

[ -f "$ENV_FILE" ] || die "crie $ENV_FILE a partir de deploy.env.example"
# shellcheck disable=SC1090
. "$ENV_FILE"

save_setting() { # nome, valor
  local tmp
  tmp="$(mktemp "$ENV_FILE.XXXXXX")"
  grep -v "^$1=" "$ENV_FILE" > "$tmp" || true
  printf '%s=%s\n' "$1" "$2" >> "$tmp"
  chmod 600 "$tmp"
  mv "$tmp" "$ENV_FILE"
}

# Pede na tela a chave que ainda não foi preenchida e guarda no deploy.env.
ask_secret() { # nome, descrição
  local value="${!1:-}"
  case "$value" in
    ""|COLOQUE_*)
      [ -t 0 ] || die "preencha $1 em $ENV_FILE"
      read -rsp "$2 (o texto não aparece): " value
      echo
      [ -n "$value" ] || die "$1 não pode ficar vazio"
      save_setting "$1" "$value"
      printf -v "$1" '%s' "$value"
      ;;
  esac
}
if [ "${1:-}" = "--trocar-chaves" ]; then
  R2_ACCESS_KEY_ID=""
  R2_SECRET_ACCESS_KEY=""
fi
ask_secret R2_ACCESS_KEY_ID "Cole a Access Key do R2"
ask_secret R2_SECRET_ACCESS_KEY "Cole a Secret Key do R2"

for var in R2_ENDPOINT R2_BUCKET_NAME R2_REGION R2_PUBLIC_URL; do
  [ -n "${!var:-}" ] || die "preencha $var em $ENV_FILE"
done
# O app recusa atualização que não venha por https.
case "$R2_PUBLIC_URL" in https://*) ;; *) die "R2_PUBLIC_URL precisa começar com https://" ;; esac
R2_PUBLIC_URL="${R2_PUBLIC_URL%/}"
R2_ENDPOINT="${R2_ENDPOINT%/}"

export JAVA_HOME="${JAVA_HOME:-$TOOLS/jdk}" ANDROID_HOME="${ANDROID_HOME:-$TOOLS/sdk}"
export PATH="$JAVA_HOME/bin:$PATH"
[ -f "$DIR/keystore/keystore.properties" ] || die "chave de assinatura não encontrada em $DIR/keystore"

VERSION_FILE="$DIR/version.properties"
OLD_CODE="$(sed -n 's/^versionCode=//p' "$VERSION_FILE")"
CODE=$((OLD_CODE + 1))
NAME="1.0.$CODE"

# A versão só fica registrada se o deploy chegar até o fim.
published=false
restore_version() { $published || echo "versionCode=$OLD_CODE" > "$VERSION_FILE"; }
trap restore_version EXIT
echo "versionCode=$CODE" > "$VERSION_FILE"

echo "==> Compilando a versão $NAME"
cd "$DIR"
./gradlew assembleRelease --no-daemon -q -PupdateUrl="$R2_PUBLIC_URL/$PREFIX/version.json"
APK="$DIR/app/build/outputs/apk/release/app-release.apk"
"$ANDROID_HOME"/build-tools/*/apksigner verify "$APK" >/dev/null 2>&1 || die "assinatura do APK inválida"

SHA256="$(sha256sum "$APK" | cut -d' ' -f1)"
WORK="$(mktemp -d)"
trap 'restore_version; rm -rf "$WORK"' EXIT
cat > "$WORK/version.json" <<EOF
{
  "versionCode": $CODE,
  "versionName": "$NAME",
  "apkUrl": "$R2_PUBLIC_URL/$PREFIX/bingo-show-tv-$NAME.apk",
  "sha256": "$SHA256"
}
EOF

put() { # arquivo, chave no bucket, tipo, cache
  local status
  local download="${2##*/}"
  # As chaves vão pela entrada padrão para não aparecerem na lista de processos.
  status="$(printf 'user = "%s:%s"\n' "$R2_ACCESS_KEY_ID" "$R2_SECRET_ACCESS_KEY" \
    | curl -K - -sS -m 300 -o "$WORK/response" -w '%{http_code}' \
        --aws-sigv4 "aws:amz:$R2_REGION:s3" \
        -H "Content-Type: $3" -H "Cache-Control: $4" \
        -H "Content-Disposition: attachment; filename=\"$download\"" \
        -T "$1" "$R2_ENDPOINT/$R2_BUCKET_NAME/$2")" || die "sem conexão com o R2"
  case "$status" in
    200) ;;
    403)
      grep -q AccessDenied "$WORK/response" && die "esta chave não tem permissão de escrita no bucket $R2_BUCKET_NAME. Crie uma chave \"Object Read & Write\" e rode: ./deploy.sh --trocar-chaves"
      die "o R2 recusou as chaves (HTTP 403). Para colar de novo, rode: ./deploy.sh --trocar-chaves"
      ;;
    401) die "o R2 recusou as chaves (HTTP 401). Para colar de novo, rode: ./deploy.sh --trocar-chaves" ;;
    *) die "o R2 respondeu HTTP $status: $(head -c 300 "$WORK/response")" ;;
  esac
}

MIME="application/vnd.android.package-archive"
echo "==> Enviando para o R2"
# O version.json vai por último: as TVs nunca veem uma versão sem o APK no ar.
put "$APK" "$PREFIX/bingo-show-tv-$NAME.apk" "$MIME" "public, max-age=31536000, immutable"
put "$APK" "$PREFIX/bingo-show-tv.apk" "$MIME" "no-cache"
put "$APK" "$SHORT_APK" "$MIME" "no-cache"
put "$WORK/version.json" "$PREFIX/version.json" "application/json" "no-cache"

echo "==> Conferindo o link público"
LIVE="$(curl -fsS -m 30 "$R2_PUBLIC_URL/$PREFIX/version.json?t=$(date +%s)")" \
  || die "enviei o APK, mas o link público não respondeu. O domínio $R2_PUBLIC_URL está ligado a este bucket?"
case "$LIVE" in
  *"\"versionCode\": $CODE,"*) ;;
  *) die "o link público não mostra a versão $CODE. Confira se R2_PUBLIC_URL é deste bucket." ;;
esac

published=true
echo
echo "Versão $NAME publicada."
echo "Link para digitar na TV: ${R2_PUBLIC_URL#https://}/$SHORT_APK"
