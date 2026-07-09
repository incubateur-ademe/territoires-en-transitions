#!/bin/sh
# Entrypoint du conteneur unique « apps » : réplique `make dev` (un seul
# processus `nx run-many`) à l'intérieur d'un conteneur. Comme il n'y a qu'un
# seul nx, le graphe de tâches construit les libs partagées (domain,
# design-tokens, pdf-components, backend) UNE seule fois — plus de course entre
# conteneurs sur /repo/**/dist. APPS_CMD choisit le script pnpm : `dev` par
# défaut (app, auth, panier, site, backend), ou `dev:app` / `dev:backend`… pour
# un sous-ensemble.
set -e

# Reset de l'état transitoire nx qui persiste sur le bind mount /repo/.nx entre
# deux démarrages du conteneur : marqueurs de tâches continues + socket du
# daemon. Sans ça, après un restart, nx croit que app:dev / backend:dev tournent
# déjà dans un process parent (« already invoked by a parent Nx process » →
# « Waiting for … in another nx process ») et se bloque. Le cache des artefacts
# (NX_CACHE_DIRECTORY, volume dédié) n'est pas touché.
rm -rf .nx/workspace-data 2>/dev/null || true

# L'install des dépendances est faite en amont par le one-shot `deps` (hors TTY :
# le rendu de progression de pnpm/postinstall s'emballe à 100 % CPU sous tty).
# Ici on ne fait que lancer les apps avec l'env fusionné de chaque app + racine
# (parité make dev).
# exec : le process nx devient l'enfant direct de l'init (tini) → signaux et TTY
# (TUI nx) propagés correctement.
exec dotenvx run --env-keys-file=.env.keys --ignore=MISSING_ENV_FILE \
  -f apps/app/.env.local -f apps/app/.env \
  -f apps/auth/.env.local -f apps/auth/.env \
  -f apps/panier/.env.local -f apps/panier/.env \
  -f apps/site/.env.local -f apps/site/.env \
  -f apps/backend/.env.local -f apps/backend/.env \
  -f apps/tools/.env.local -f apps/tools/.env \
  -f .env.local -f .env \
  -- pnpm "${APPS_CMD:-dev}"
