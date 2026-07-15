-include Makefile.local

DOCKER ?= docker
COMPOSE = $(DOCKER) compose
DOTENVX ?= npx -y @dotenvx/dotenvx
ENV_KEYS = --env-keys-file=.env.keys

ENV_ROOT = .env

# UID/GID hôte transmis au build des images d'apps : leur user interne est
# remappé pour éviter tout fichier root sur les bind mounts.
export UID := $(shell id -u)
export GID := $(shell id -g)

# Profils compose des services (sans les apps) — cf. docker-compose.yml
SERVICES_PROFILES = supabase,studio,redis,strapi

# Checkout principal vs worktree lié (.git est un fichier dans un worktree).
# La stack docker `tet` (name: fixe dans compose) appartient au checkout
# principal : un worktree ne lance jamais compose localement, il délègue.
MAIN_ROOT   = $(shell git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
IS_WORKTREE = $(shell test -f .git && echo 1)

# Seuils inotify minimaux pour lancer les apps conteneurisées (cf. README) :
# Turbopack/nx watchent tout le monorepo, les valeurs par défaut de nombreuses
# distributions (128 / 65536) sont insuffisantes — voir preflight-inotify.
INOTIFY_MIN_INSTANCES = 512
INOTIFY_MIN_WATCHES = 524288

env_flags = $(foreach f,$(1),$(foreach g,$(wildcard $(f).local) $(wildcard $(f)),-f $(g)))
# --strict : dotenvx sort en erreur (code 1) si une variable ne peut pas être
# déchiffrée (clé .env.keys manquante), la commande n'est alors jamais lancée.
decrypt_env = $(DOTENVX) run $(ENV_KEYS) --strict $(call env_flags,$(1))

# Fichier .env ciblé par env-set/env-get : celui de l'app si app= est fourni,
# sinon choix interactif parmi les .env du monorepo (scripts/pick-env-file.mjs).
env_target = $(if $(app),apps/$(app)/.env,$$(node scripts/pick-env-file.mjs))

.DEFAULT_GOAL = help
.PHONY: help env-set env-get \
        install dev \
        infra-up services-scoped-up worktree-env guard-main warn-shared-db \
        up services-up node-base stop down logs ps \
        preflight-inotify inotify-persist \
        db-init db-migrate db-seed db-reset db-shell db-import-referentiels \
        cms-pull cms-pull-local

help: ## Affiche cette aide
	@grep -E '(^[a-zA-Z0-9_-]+:.*?##.*$$)|(^##)' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}{printf "\033[32m%-15s\033[0m %s\n", $$1, $$2}' | sed -e 's/\[32m##/[33m/'

## —— 🔐 Variables d'environnement ———————————————————————————————————————————
env-set: export ENV_ENTRY = $(or $(e),$(k)=$(v))
env-set: ## Définit une valeur chiffrée : make env-set e=CLE=valeur [app=backend]
	@f=$(env_target) && test -n "$$f" && test "$$ENV_ENTRY" != "=" && \
	$(DOTENVX) set "$${ENV_ENTRY%%=*}" -f $$f $(ENV_KEYS) -- "$${ENV_ENTRY#*=}"

env-get: ## Lit une valeur déchiffrée : make env-get k=CLE [app=backend]
	@f=$(env_target) && test -n "$$f" && $(DOTENVX) get $(k) -f $$f $(ENV_KEYS)

## —— 🐳 Stack locale (services + apps) ———————————————————————————————————————
# internes (absents du help) :
# - services-up : tous les services, sans prompt (db-init)
# - node-base : socle commun des images d'apps (.docker/apps/base.Dockerfile),
#   construit avec l'UID/GID hôte ; les .docker/apps/<app>/ font FROM tet-node-dev
services-up:
	COMPOSE_PROFILES=$(SERVICES_PROFILES) $(COMPOSE) up -d --wait

node-base:
	$(DOCKER) build -t tet-node-dev -f .docker/apps/base.Dockerfile --build-arg UID=$(UID) --build-arg GID=$(GID) .docker/apps

# Garde-fou avant de lancer les apps : avec des limites inotify trop basses,
# Turbopack plante (« OS file watch limit reached »), le conteneur sort avant
# d'être healthy et le --wait de compose replie toute la stack — échec obscur.
# On échoue tôt avec la marche à suivre plutôt que de laisser make up s'effondrer.
preflight-inotify:
	@i=$$(cat /proc/sys/fs/inotify/max_user_instances 2>/dev/null || echo 0); \
	w=$$(cat /proc/sys/fs/inotify/max_user_watches 2>/dev/null || echo 0); \
	if [ "$$i" -lt $(INOTIFY_MIN_INSTANCES) ] || [ "$$w" -lt $(INOTIFY_MIN_WATCHES) ]; then \
		echo "✗ limites inotify trop basses pour les apps Next/Turbopack :"; \
		echo "    max_user_instances=$$i (min $(INOTIFY_MIN_INSTANCES)), max_user_watches=$$w (min $(INOTIFY_MIN_WATCHES))"; \
		echo "  Sans ça Turbopack plante et la stack se replie silencieusement."; \
		echo "  → une fois pour toutes :  make inotify-persist"; \
		echo "  → session courante :      sudo sysctl fs.inotify.max_user_instances=$(INOTIFY_MIN_INSTANCES) fs.inotify.max_user_watches=$(INOTIFY_MIN_WATCHES)"; \
		exit 1; \
	fi

inotify-persist: ## Relève et persiste les limites inotify requises par les apps (sudo)
	@printf 'fs.inotify.max_user_instances=$(INOTIFY_MIN_INSTANCES)\nfs.inotify.max_user_watches=$(INOTIFY_MIN_WATCHES)\n' \
		| sudo tee /etc/sysctl.d/60-inotify.conf >/dev/null && \
	sudo sysctl --system >/dev/null && \
	echo "✓ limites inotify persistées dans /etc/sysctl.d/60-inotify.conf"

# Guards worktree : la stack docker `tet` (name: fixe) est partagée — seul le
# checkout principal la pilote (un up/down worktree remonterait les bind mounts
# du worktree dans la stack commune). La base, elle, reste accessible d'un
# worktree en connaissance de cause : développer une migration y est le cas
# nominal, d'où l'avertissement plutôt que le refus.
guard-main:
	@if [ -n "$(IS_WORKTREE)" ]; then \
		echo "✗ stack docker partagée — lancez cette commande depuis le checkout principal :"; \
		echo "    cd $(MAIN_ROOT)"; exit 1; fi

warn-shared-db:
	@if [ -n "$(IS_WORKTREE)" ]; then \
		echo "⚠ base PARTAGÉE avec le checkout principal — vos changements s'y appliquent"; fi

stop: guard-main
	$(COMPOSE) stop
up: guard-main ## Lance la stack cochée en conteneurs (sélecteur, sélection mémorisée)
	@profiles=$$(node scripts/pick-stack.mjs) || exit 1; \
	if node scripts/dev-apps.mjs has-app "$$profiles"; then \
		$(MAKE) --no-print-directory preflight-inotify || exit 1; \
		$(MAKE) --no-print-directory node-base || exit 1; fi; \
	enabled=$$(COMPOSE_PROFILES=$$profiles $(COMPOSE) config --services); \
	stop=""; for svc in $$($(COMPOSE) --profile '*' ps --format '{{.Service}}'); do \
		echo "$$enabled" | grep -qx "$$svc" || stop="$$stop $$svc"; done; \
	if [ -n "$$stop" ]; then echo "⏹ arrêt des composants décochés :$$stop"; \
		$(COMPOSE) --profile '*' stop $$stop; fi; \
	COMPOSE_PROFILES=$$profiles $(COMPOSE) up -d --build --wait --remove-orphans || \
		{ echo "✗ une app n'est pas devenue saine — les services restent en marche ; make logs s=<app> pour investiguer"; exit 1; }

down: guard-main ## Stoppe tout (les données sont conservées)
	$(COMPOSE) --profile '*' down

logs: ## Suit les logs : make logs [s=apps]
	$(COMPOSE) --profile '*' logs -f -n 100 $(s)

ps: ## Liste les conteneurs de la stack
	$(COMPOSE) --profile '*' ps -a

## —— 🗄️  Base de données —————————————————————————————————————————————————————
db-init: guard-main services-up db-migrate db-import-referentiels db-seed ## Initialise la base de zéro : services + migrations + référentiels + données de test
	@echo "✓ base prête — lancez les apps avec make dev (host) ou make up (docker)"

db-migrate: warn-shared-db ## Applique les migrations sqitch
	$(COMPOSE) --profile dbtools --profile supabase run --rm --build sqitch deploy --mode change

# Comme en CI, les seeds supposent les référentiels déjà importés (les tables
# banatic_2025_competence, action…, remplies par db-import-referentiels).
db-seed: warn-shared-db ## Charge les données de test si la base est vide
	@count=$$($(COMPOSE) exec db psql -U postgres -tAc 'select count(*) from collectivite' 2>/dev/null || echo -1); \
	if [ "$$count" = "0" ]; then \
		{ $(COMPOSE) --profile dbtools --profile supabase run --rm seeder seed/seed.sh && \
		  $(COMPOSE) --profile dbtools --profile supabase run --rm seeder seed/geojson.sh; } || \
		{ echo "✗ seed interrompu : la base est dans un état partiel — make db-reset après correction"; exit 1; }; \
	elif [ "$$count" = "-1" ]; then echo "✗ base inaccessible ou non migrée (make db-init)"; exit 1; \
	else echo "✓ base déjà peuplée ($$count collectivités) — make db-reset pour repartir de zéro"; fi

# Les specs d'import lisent les CSV du dépôt (pas les Google Sheets), mais le
# backend qu'elles démarrent exige un env complet → .env.keys nécessaire.
db-import-referentiels: ## Importe référentiels & indicateurs via les tests backend (CSV du dépôt)
	@key=$$($(DOTENVX) get GCLOUD_SERVICE_ACCOUNT_KEY -f apps/backend/.env $(ENV_KEYS) 2>/dev/null); \
	if [ -z "$$key" ]; then \
		echo "✗ env backend indéchiffrable (.env.keys manquant ?) — les seeds dépendent de cet import, impossible de continuer"; exit 1; \
	fi
	$(call decrypt_env,apps/backend/.env $(ENV_ROOT)) -- pnpm test:backend import-indicateur-definition.controller.e2e-spec.ts --skip-nx-cache
	$(call decrypt_env,apps/backend/.env $(ENV_ROOT)) -- pnpm test:backend import-personnalisation-question.controller.e2e-spec.ts --skip-nx-cache
	$(call decrypt_env,apps/backend/.env $(ENV_ROOT)) -- pnpm test:backend import-referentiel.controller.e2e-spec.ts --skip-nx-cache
db-rm-volume:
	$(DOCKER) volume rm -f tet_db-data tet_db-config
# Stoppe toute la stack avant de supprimer le volume : les services connectés
# (realtime, auth…) doivent redémarrer sur la base neuve.
db-reset: guard-main down db-rm-volume db-init ## ⚠ Détruit les données locales puis réinitialise la base
db-shell: warn-shared-db ## Ouvre psql dans la base locale
	$(COMPOSE) exec db psql -U postgres

## —— 📰 CMS Strapi ———————————————————————————————————————————————————————————
cms-pull: guard-main ## ⚠ Remplace le contenu Strapi local par celui de l'instance distante
	@$(call decrypt_env,$(ENV_ROOT)) -- sh -c '\
		test -n "$$STRAPI_REMOTE_URL" && test -n "$$STRAPI_TRANSFER_TOKEN" || \
			{ echo "✗ STRAPI_REMOTE_URL / STRAPI_TRANSFER_TOKEN indisponibles dans $(ENV_ROOT)"; \
			  echo "  (transfer token ≠ API token : à créer sur le remote dans Settings → Transfer tokens, permission pull)"; exit 1; }; \
		$(COMPOSE) stop strapi && \
		$(COMPOSE) run --rm strapi \
			npm run strapi -- transfer --from "$${STRAPI_REMOTE_URL%/}/admin" --from-token "$$STRAPI_TRANSFER_TOKEN" --force --exclude files; \
		status=$$?; $(COMPOSE) up -d strapi && exit $$status'
	@node scripts/strapi-localize-uploads.mjs

## —— 🧑‍💻 Développement ———————————————————————————————————————————————————————
install: ## Installe les dépendances (token Bryntum injecté depuis le .env racine) et compile canvas et supabase
	@$(if $(IS_WORKTREE),node scripts/worktree-env.mjs,true)
	@$(call decrypt_env,$(ENV_ROOT)) -- sh -c '\
		case "$$BRYNTUM_ACCESS_TOKEN" in ""|encrypted:*) echo "✗ BRYNTUM_ACCESS_TOKEN vide ou indéchiffrable dans $(ENV_ROOT) (clé .env.keys manquante ?)"; exit 1;; esac; \
		pnpm install && pnpm rebuild canvas supabase'

dev: ## Lance les apps cochées sur l'hôte : make dev [apps=app,auth,backend] [infra=skip]
	@$(if $(IS_WORKTREE),node scripts/worktree-env.mjs,true)
	@apps=$$(node scripts/dev-apps.mjs apps $(apps)) || exit 1; \
	if [ "$(infra)" != "skip" ]; then $(MAKE) --no-print-directory infra-up apps="$$apps" || exit 1; fi; \
	DOTENVX="$(DOTENVX)" node scripts/dev-apps.mjs run $$apps

worktree: ## Crée un worktree prêt à l'emploi : make worktree [t=feature|bugfix|hotfix|release|chore n=nom-du-sujet]
	@node scripts/new-worktree.mjs "$(t)" "$(n)"

worktree-env: ## Prépare un worktree : slot de ports, .env.local, .env.keys (auto via make dev)
	@node scripts/worktree-env.mjs

worktree-prune: ## Nettoie les stacks docker des worktrees supprimés (projets tet-wt* fantômes)
	@DOCKER="$(DOCKER)" node scripts/prune-worktree-stacks.mjs

infra-up:
	@profiles=$$(node scripts/dev-apps.mjs infra $(apps)) || exit 1; \
	if [ -n "$(IS_WORKTREE)" ]; then \
		COMPOSE_PROFILES=$$profiles $(MAKE) -C $(MAIN_ROOT) --no-print-directory services-scoped-up; \
	else COMPOSE_PROFILES=$$profiles $(COMPOSE) up -d --wait; fi

services-scoped-up:
	$(COMPOSE) up -d --wait
