#!/bin/bash
# Prépare une session Claude Code cloud : Node et pnpm aux versions du repo,
# dépendances, navigateur Playwright, puis vérifie que l'app de prototypes se
# construit. Les journaux vont sur stderr ; stdout n'affiche que ce que
# l'agent doit savoir en début de session (un prérequis manquant, un échec).
#
# Prérequis dans l'environnement cloud (cf. apps/prototypes/README.md) :
# token `BRYNTUM_ACCESS_TOKEN` et domaines `npm.bryntum.com` et
# `codeload.github.com` autorisés.
set -euo pipefail

log() { echo "[session-start] $*" >&2; }

# Version majeure de Node du repo (.nvmrc), installée via le nvm du container.
setup_node() {
  local major
  major="$(cat .nvmrc)"
  # shellcheck disable=SC1091
  source /opt/nvm/nvm.sh
  nvm install "$major" >&2
  nvm use "$major" >&2
  local node_bin
  node_bin="$(dirname "$(nvm which "$major")")"
  export PATH="$node_bin:$PATH"
  echo "export PATH=\"$node_bin:\$PATH\"" >>"$CLAUDE_ENV_FILE"
  log "node $(node -v)"
}

# Version de pnpm épinglée par `packageManager` dans le package.json racine.
setup_pnpm() {
  local version
  version="$(node -p "require('./package.json').packageManager.split('@')[1]")"
  if [ "$(pnpm -v 2>/dev/null || true)" != "$version" ]; then
    npm install -g "pnpm@$version" >&2
  fi
  log "pnpm $(pnpm -v)"
}

install_dependencies() {
  if [ -n "${BRYNTUM_ACCESS_TOKEN:-}" ]; then
    env "pnpm_config_//npm.bryntum.com/:_authToken=$BRYNTUM_ACCESS_TOKEN" \
      pnpm install --frozen-lockfile >&2
  else
    # Sans variable, le token peut être injecté par le proxy (Network secrets).
    pnpm install --frozen-lockfile >&2
  fi
}

# Le Playwright du repo attend une révision précise de Chromium ; le container
# en fournit une autre dans /opt/pw-browsers. On expose la révision installée
# sous le nom attendu, sans rien télécharger.
setup_playwright_browsers() {
  local expected available browsers_dir
  expected="$(pnpm exec playwright install --dry-run chromium 2>/dev/null |
    sed -n 's/.*chromium-headless-shell v\([0-9]*\).*/\1/p' | head -1)"
  if [ -z "$expected" ]; then
    log "révision Chromium de Playwright introuvable, navigateur non configuré"
    return 0
  fi
  if [ -d "/opt/pw-browsers/chromium_headless_shell-$expected" ]; then
    browsers_dir=/opt/pw-browsers
  else
    available="$(find /opt/pw-browsers -maxdepth 1 -name 'chromium_headless_shell-*' | sed 's/.*-//' | sort -n | tail -1)"
    browsers_dir="$HOME/.cache/tet-playwright-browsers"
    mkdir -p "$browsers_dir"
    ln -sfn "/opt/pw-browsers/chromium-$available" "$browsers_dir/chromium-$expected"
    ln -sfn "/opt/pw-browsers/chromium_headless_shell-$available" "$browsers_dir/chromium_headless_shell-$expected"
    log "chromium $available exposé comme révision $expected"
  fi
  echo "export PLAYWRIGHT_BROWSERS_PATH=\"$browsers_dir\"" >>"$CLAUDE_ENV_FILE"
}

check_prototypes_build() {
  NX_DAEMON=false NX_NO_CLOUD=true \
    pnpm exec nx run prototypes:build --skipSync --outputStyle=static >&2
}

main() {
  if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
    exit 0
  fi
  cd "$CLAUDE_PROJECT_DIR"

  setup_node
  setup_pnpm

  if ! install_dependencies; then
    cat <<'MSG'
⚠️ session-start : `pnpm install` a échoué. Vérifier dans les réglages de
l'environnement cloud que `BRYNTUM_ACCESS_TOKEN` est défini (variable ou
Network secret) et que `npm.bryntum.com` et `codeload.github.com` sont dans
les domaines autorisés. Ne pas contourner les contrôles supply-chain de pnpm.
MSG
    exit 0
  fi

  setup_playwright_browsers

  if check_prototypes_build; then
    echo "session-start : dépendances installées, \`nx build prototypes\` OK."
  else
    echo "⚠️ session-start : \`nx build prototypes\` échoue, voir \`pnpm exec nx run prototypes:build\`."
  fi
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
fi
