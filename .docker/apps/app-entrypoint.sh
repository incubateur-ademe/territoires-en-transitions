#!/bin/sh
# Entrypoint générique des conteneurs d'apps — APP est injecté par compose.
# Env per-app uniquement : le .env de chaque app contient déjà les URLs des
# autres apps (NEXT_PUBLIC_*_URL). L'install est faite en amont par le
# one-shot `deps` (hors TTY : le rendu de progression de pnpm/postinstall
# s'emballe à 100 % CPU sous tty).
set -e

# exec : nx enfant direct de tini → SIGTERM propagé (arrêt propre, qui retire
# le marqueur running-tasks nx) ; le daemon partagé est raccordé via
# NX_SOCKET_DIR. Si nx bloque sur « Waiting for … in another nx process »
# (marqueur orphelin : mort sans SIGTERM puis PID hôte réattribué, p. ex.
# après un reboot), réinitialiser l'état nx des conteneurs :
#   make down && docker volume rm tet_nx-workspace-data
# (tet-wt<slot>_… depuis un worktree ; seul l'index de cache est perdu)
exec dotenvx run --env-keys-file=.env.keys --ignore=MISSING_ENV_FILE \
  -f "apps/${APP}/.env.local" -f "apps/${APP}/.env" \
  -f .env.local -f .env \
  -- pnpm exec nx dev "${APP}"
