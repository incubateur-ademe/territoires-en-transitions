#!/bin/sh
# Daemon nx partagé par tous les conteneurs d'apps : socket + état sur le
# volume nx-workspace-data (NX_WORKSPACE_DATA_DIRECTORY / NX_SOCKET_DIR) —
# jamais le .nx/ de l'hôte, dont les chemins et PIDs n'ont aucun sens ici.
# C'est le scénario multi-terminaux que nx supporte nativement (plusieurs
# `nx dev <app>` raccordés au même daemon), appliqué à un conteneur par app.
# Démarre après `deps` (node_modules requis) et avant `libs` et les apps
# (depends_on + healthcheck socket).
set -e

# L'état daemon de la session précédente est forcément périmé (le daemon est
# mort avec son conteneur) : purge de server-process.json + socket — SANS
# toucher machine-v3.db, qui porte l'index du cache.
rm -rf "$NX_WORKSPACE_DATA_DIRECTORY/d" "$NX_SOCKET_DIR" 2>/dev/null || true

# Entrée interne de nx (celle que le client spawnerait lui-même en arrière-
# plan), exécutée au premier plan : le cycle de vie du conteneur EST celui du
# daemon (restart: unless-stopped, healthcheck, make logs s=nx-daemon).
# ⚠ chemin interne nx 23 — à revalider aux montées de version ; repli :
#   pnpm exec nx daemon --start && tail -F "$NX_WORKSPACE_DATA_DIRECTORY/d/daemon.log"
exec node node_modules/nx/dist/src/daemon/server/start.js
