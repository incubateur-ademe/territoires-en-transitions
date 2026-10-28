#!/bin/bash
# Prépare une session Claude Code cloud : Node et pnpm aux versions du repo,
# dépendances, navigateur Playwright, puis vérifie que l'app de prototypes se
# construit. Les journaux vont sur stderr ; stdout n'affiche que ce que
# l'agent doit savoir en début de session (un prérequis manquant, un échec).
#
# Prérequis de l'environnement cloud : cf. section « Prérequis » de
# apps/prototypes/README.md.
set -euo pipefail

log() { echo "[session-start] $*" >&2; }

# Un échec inattendu ne doit jamais être silencieux : la session le voit.
report_failure() {
  echo "⚠️ session-start : échec inattendu ligne $1 de .claude/hooks/session-start.sh."
}
trap 'report_failure $LINENO' ERR

# Version majeure de Node du repo (.nvmrc), installée via le nvm du container.
# nvm ne supporte pas `set -eu` : son chargement peut renvoyer un code non nul
# (3, activation automatique d'une version absente) sans que ce soit une
# erreur. On le charge sans activation, `set -eu` suspendu, puis on vérifie
# le résultat explicitement.
setup_node() {
  local major node_bin
  major="$(cat .nvmrc)"
  set +eu
  trap - ERR
  # shellcheck disable=SC1091
  source /opt/nvm/nvm.sh --no-use
  nvm install "$major" >&2
  node_bin="$(dirname "$(nvm which "$major" 2>/dev/null)")"
  trap 'report_failure $LINENO' ERR
  set -eu
  if [ ! -x "$node_bin/node" ]; then
    echo "⚠️ session-start : Node $major introuvable après nvm install, installation interrompue."
    exit 0
  fi
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

# Le token Bryntum n'est jamais dans la session : il est enregistré en Network
# secret de l'environnement cloud, et le proxy l'ajoute aux requêtes vers
# npm.bryntum.com.
install_dependencies() {
  pnpm install --frozen-lockfile >&2
}

# Sans token Bryntum ni accès à codeload.github.com, l'installation complète
# échoue. Les prototypes n'ont besoin ni de Bryntum ni de crisp-api : on les
# retire de la copie de travail le temps de l'installation, puis on restaure
# package.json et pnpm-lock.yaml pour que rien n'en parte dans un commit.
install_dependencies_without_private() {
  local status=0
  node .claude/hooks/strip-private-deps.mjs
  pnpm install --no-frozen-lockfile >&2 || status=$?
  git checkout -- package.json pnpm-lock.yaml
  return "$status"
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

  local partial_install=false
  if ! install_dependencies; then
    log "installation complète impossible, repli sans Bryntum ni crisp-api"
    partial_install=true
    if ! install_dependencies_without_private; then
      cat <<'MSG'
⚠️ session-start : `pnpm install` a échoué, même sans Bryntum ni crisp-api.
Vérifier les prérequis de l'environnement cloud listés dans
apps/prototypes/README.md (section « Prérequis »). Ne pas contourner les
contrôles supply-chain de pnpm.
MSG
      exit 0
    fi
  fi

  setup_playwright_browsers

  if "$partial_install"; then
    cat <<'MSG'
session-start : dépendances installées sans Bryntum ni crisp-api (pas de
token) : les prototypes se construisent, pas les pages de l'app qui en
dépendent. package.json et pnpm-lock.yaml sont restés intacts.
MSG
  fi

  if check_prototypes_build; then
    echo "session-start : dépendances installées, \`nx build prototypes\` OK."
  else
    echo "⚠️ session-start : \`nx build prototypes\` échoue, voir \`pnpm exec nx run prototypes:build\`."
  fi
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
fi
