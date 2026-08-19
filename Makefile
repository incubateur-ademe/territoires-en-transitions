-include Makefile.local

DOCKER ?= docker
DOTENVX ?= npx -y @dotenvx/dotenvx
ENV_KEYS = --env-keys-file=.env.keys

ENV_ROOT = .env
COMPOSE = $(DOTENVX) run -q $(ENV_KEYS) -f $(ENV_ROOT) -- $(DOCKER) compose

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
UNAME_S     = $(shell uname -s)

# Le séquencement de db-reset/db-init repose sur l'ordre des prérequis :
# incompatible avec make -j (db-rm-volume partirait pendant le down).
.NOTPARALLEL:

# Seuils inotify minimaux pour lancer les apps conteneurisées (cf. README) :
# Turbopack/nx watchent tout le monorepo, les valeurs par défaut de nombreuses
# distributions (128 / 65536) sont insuffisantes — voir preflight-inotify.
# Concerne uniquement Linux : sur macOS, Docker Desktop exécute les
# conteneurs dans une VM Linux séparée dont le noyau (donc ses limites
# inotify) n'a rien à voir avec celui de macOS (qui n'a pas /proc du tout).
INOTIFY_MIN_INSTANCES = 512
INOTIFY_MIN_WATCHES = 524288

env_flags = $(foreach f,$(1),$(foreach g,$(wildcard $(f).local) $(wildcard $(f)),-f $(g)))
# --strict : dotenvx sort en erreur (code 1) si une variable ne peut pas être
# déchiffrée (clé .env.keys manquante), la commande n'est alors jamais lancée.
decrypt_env = $(DOTENVX) run $(ENV_KEYS) --strict $(call env_flags,$(1))
# Exécute une commande Node sur l'hôte (mode dev) ou dans nx-daemon (mode Docker).
run_node = $(compose_here); \
	if $$C --profile '*' ps --status running --services 2>/dev/null | grep -qx 'nx-daemon'; then \
		$$C exec -T nx-daemon sh -lc 'dotenvx run $(ENV_KEYS) --ignore=MISSING_ENV_FILE $(call env_flags,$(ENV_ROOT)) -- $(1)'; \
	else \
		$(MAKE) --no-print-directory ensure-deps || exit 1; \
		$(call decrypt_env,$(ENV_ROOT)) -- $(1); \
	fi

colored = red()    { printf '\033[31m%s\033[0m\n' "$$*"; }; \
          green()  { printf '\033[32m%s\033[0m\n' "$$*"; }; \
          yellow() { printf '\033[33m%s\033[0m\n' "$$*"; }; \
          blue()   { printf '\033[34m%s\033[0m\n' "$$*"; }

env_keys_help = blue "  Récupérez le contenu de .env.keys dans Vaultwarden puis exécutez :"; \
		        blue "    make env-keys"

hooks_path_backup_key = tet.hooksPathBackup
hooks_path_backup_present_key = tet.hooksPathBackupPresent

# Fichier .env ciblé par env-set/env-get : celui de l'app si app= est fourni,
# sinon choix interactif parmi les .env du monorepo (scripts/pick-env-file.mts).
env_target = $(if $(app),apps/$(app)/.env,$$(node scripts/pick-env-file.mts))

.DEFAULT_GOAL = help
.PHONY: help env-set env-get env-keys \
	lint test \
        install dev graph \
	hooks hooks-off \
        infra-up services-scoped-up worktree worktree-env worktree-prune guard-main warn-shared-db \
        up services-up node-base stop down cache-clean workflow-graph logs ps tui \
        preflight-inotify preflight-env-keys ensure-deps inotify-persist \
        db-init db-migrate db-seed db-reset db-shell db-import-referentiels seeds_rebuild_from_source \
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

env-keys: ## Crée .env.keys par collage dans le terminal
	@$(colored); \
	if [ -f .env.keys ]; then \
		yellow "ℹ fichier .env.keys déjà présent — aucune modification"; \
		exit 0; \
	fi; \
	if [ ! -t 0 ]; then \
		red "✗ make env-keys requiert un terminal interactif."; \
		blue "  Lancez la commande dans un terminal puis collez le contenu de .env.keys."; \
		exit 1; \
	fi; \
	tmp_file=$$(mktemp .env.keys.tmp.XXXXXX) || { red "✗ impossible de préparer .env.keys."; exit 1; }; \
	cleanup() { stty echo >/dev/null 2>&1 || true; rm -f "$$tmp_file"; }; \
	trap cleanup EXIT INT TERM; \
	stty -echo || { red "✗ impossible de masquer la saisie."; exit 1; }; \
	yellow "Collez le contenu complet de .env.keys puis terminez par Ctrl-D (saisie masquée)."; \
	cat > "$$tmp_file"; ret=$$?; \
	stty echo || { red "✗ impossible de restaurer l'affichage du terminal."; exit 1; }; \
	trap - EXIT INT TERM; \
	printf '\n'; \
	[ "$$ret" -eq 0 ] || { rm -f "$$tmp_file"; red "✗ lecture annulée."; exit 1; }; \
	tr -d '[:space:]' < "$$tmp_file" | grep -q . || { rm -f "$$tmp_file"; red "✗ aucun contenu fourni."; $(env_keys_help); exit 1; }; \
	mv "$$tmp_file" .env.keys || { rm -f "$$tmp_file"; red "✗ impossible d'écrire .env.keys."; exit 1; }; \
	green "✓ fichier .env.keys créé à la racine du projet"

## —— 🐳 Stack locale (services + apps) ———————————————————————————————————————
# internes (absents du help) :
# - services-up : tous les services, sans prompt (db-init)
# - node-base : socle commun des images d'apps (.docker/apps/base.Dockerfile),
#   construit avec l'UID/GID hôte ; les .docker/apps/<app>/ font FROM tet-node-dev
services-up:
	@$(call heal_db,$(COMPOSE))
	COMPOSE_PROFILES=$(SERVICES_PROFILES) $(COMPOSE) up -d --wait

node-base:
	$(DOCKER) build -t tet-node-dev -f .docker/apps/base.Dockerfile --build-arg UID=$(UID) --build-arg GID=$(GID) .docker/apps

preflight-env-keys:
	@$(colored); \
	if [ -z "$(IS_WORKTREE)" ] && [ ! -f .env.keys ]; then \
		red "✗ fichier .env.keys manquant à la racine du projet."; \
		$(env_keys_help); \
		exit 1; \
	fi

ensure-deps:
	@if [ ! -d node_modules ]; then \
		$(colored); blue "⏳ node_modules absent — installation des dépendances…"; \
		out=$$($(MAKE) --no-print-directory install 2>&1) || \
			{ printf '%s\n' "$$out"; exit 1; }; \
		green "✓ dépendances installées"; \
	fi

# Garde-fou avant de lancer les apps : avec des limites inotify trop basses,
# Turbopack plante (« OS file watch limit reached »), le conteneur sort avant d'être healthy.
# Non applicable sur macOS (cf. commentaire de INOTIFY_MIN_INSTANCES) : sans
# ce court-circuit, /proc absent ferait toujours lire 0 et bloquerait
# systématiquement make up, alors que la VM Docker Desktop n'est pas concernée.
preflight-inotify:
	@if [ "$(UNAME_S)" = "Darwin" ]; then exit 0; fi; \
	i=$$(cat /proc/sys/fs/inotify/max_user_instances 2>/dev/null || echo 0); \
	w=$$(cat /proc/sys/fs/inotify/max_user_watches 2>/dev/null || echo 0); \
	if [ "$$i" -lt $(INOTIFY_MIN_INSTANCES) ] || [ "$$w" -lt $(INOTIFY_MIN_WATCHES) ]; then \
		echo "✗ limites inotify trop basses pour les apps Next/Turbopack :"; \
		echo "    max_user_instances=$$i (min $(INOTIFY_MIN_INSTANCES)), max_user_watches=$$w (min $(INOTIFY_MIN_WATCHES))"; \
		echo "  Sans ça Turbopack plante et la stack se replie silencieusement."; \
		echo "  → une fois pour toutes :  make inotify-persist"; \
		echo "  → session courante :      sudo sysctl fs.inotify.max_user_instances=$(INOTIFY_MIN_INSTANCES) fs.inotify.max_user_watches=$(INOTIFY_MIN_WATCHES)"; \
		exit 1; \
	fi

inotify-persist: ## Relève et persiste les limites inotify requises par les apps (sudo ; non applicable sur macOS)
	@if [ "$(UNAME_S)" = "Darwin" ]; then \
		echo "✓ macOS : limites inotify du noyau Linux non applicables (conteneurs dans la VM Docker Desktop)"; exit 0; \
	fi; \
	printf 'fs.inotify.max_user_instances=$(INOTIFY_MIN_INSTANCES)\nfs.inotify.max_user_watches=$(INOTIFY_MIN_WATCHES)\n' \
		| sudo tee /etc/sysctl.d/60-inotify.conf >/dev/null && \
	sudo sysctl --system >/dev/null && \
	echo "✓ limites inotify persistées dans /etc/sysctl.d/60-inotify.conf"

# Comme la BASE de données est partagée entre les worktrees — les cibles qui la
# détruisent/reconstruisent (db-init, db-reset, cms-pull) restent réservées
# au tronc principal.
guard-main:
	@$(colored); if [ -n "$(IS_WORKTREE)" ]; then \
		red "✗ stack docker partagée — lancez cette commande depuis le checkout principal :"; \
		blue "    cd $(MAIN_ROOT)"; exit 1; fi

warn-shared-db:
	@if [ -n "$(IS_WORKTREE)" ]; then \
		echo "⚠ base PARTAGÉE avec le checkout principal — vos changements s'y appliquent"; fi

# Compose du répertoire courant :
# sur le tronc principal: la stack partagée `tet` ;
# depuis un worktree (tet-wt<slot>): (apps seules, docker-compose.worktree.yml)
compose_here = if [ -n "$(IS_WORKTREE)" ]; then \
		slot=$$(sed -n 's/^TET_PORT_SLOT=//p' .env.local 2>/dev/null); \
		C="env COMPOSE_PROJECT_NAME=tet-wt$$slot $(COMPOSE) -f docker-compose.yml -f docker-compose.worktree.yml"; \
	else C="$(COMPOSE)"; fi

# Compose ne recrée un conteneur que sur drift de config (labels), jamais sur
# son état réseau *runtime* : un `db` resté « running » mais détaché du réseau
# (IP et alias `db` perdus — p.ex. `tet_default` recréé/pruné sous lui) n'est
# donc pas réparé par un simple `up`. Les services qui migrent au boot
# (gotrue/storage/realtime) plantent alors sur « db introuvable » (SERVFAIL).
# On détecte le cas (conteneur présent, 0 réseau attaché) et on le force-recreate
# avant de démarrer les services. $(1) = commande compose du contexte courant.
heal_db = cid=$$($(1) --profile '*' ps -q db 2>/dev/null); \
	if [ -n "$$cid" ] && [ "$$($(DOCKER) inspect "$$cid" --format '{{len .NetworkSettings.Networks}}' 2>/dev/null)" = 0 ]; then \
		echo "⚠ db détaché du réseau — recréation avant démarrage des services"; \
		$(1) up -d --force-recreate --wait db; \
	fi

stop:
	@$(compose_here); $$C --profile '*' stop

up: preflight-env-keys ensure-deps cache-clean ## Lance la stack cochée en conteneurs : make up [p="<profile>"] (profiles : x dans make tui)
	@if [ -n "$(IS_WORKTREE)" ]; then \
		node scripts/worktree-env.mts || exit 1; \
		node scripts/pick-stack.mts $(if $(p),--profile "$(p)") >/dev/null || exit 1; \
		apps=$$(node scripts/dev-apps.mts apps) || exit 1; \
		$(MAKE) --no-print-directory preflight-inotify || exit 1; \
		$(MAKE) --no-print-directory node-base || exit 1; \
		infra=$$(node scripts/dev-apps.mts infra $$apps) || exit 1; \
		COMPOSE_PROFILES=$$infra $(MAKE) -C $(MAIN_ROOT) --no-print-directory services-scoped-up || exit 1; \
		set -a; . ./.env.local; set +a; \
		$(compose_here); profiles=$$(echo $$apps | tr ' ' ','); \
		enabled=$$(COMPOSE_PROFILES=$$profiles $$C config --services); \
		stop=""; for svc in $$($$C --profile '*' ps --format '{{.Service}}'); do \
			echo "$$enabled" | grep -qx "$$svc" || stop="$$stop $$svc"; done; \
		if [ -n "$$stop" ]; then echo "⏹ arrêt des composants décochés :$$stop"; \
			$$C --profile '*' stop $$stop; fi; \
		COMPOSE_PROFILES=$$profiles $$C up -d --build --wait --remove-orphans || \
			{ echo "✗ une app n'est pas devenue saine — make logs s=<app> pour investiguer"; exit 1; }; \
	else \
		profiles=$$(node scripts/pick-stack.mts $(if $(p),--profile "$(p)")) || exit 1; \
		if node scripts/dev-apps.mts has-app "$$profiles"; then \
			$(MAKE) --no-print-directory preflight-inotify || exit 1; \
			$(MAKE) --no-print-directory node-base || exit 1; fi; \
		enabled=$$(COMPOSE_PROFILES=$$profiles $(COMPOSE) config --services); \
		stop=""; for svc in $$($(COMPOSE) --profile '*' ps --format '{{.Service}}'); do \
			echo "$$enabled" | grep -qx "$$svc" || stop="$$stop $$svc"; done; \
		if [ -n "$$stop" ]; then echo "⏹ arrêt des composants décochés :$$stop"; \
			$(COMPOSE) --profile '*' stop $$stop; fi; \
		$(call heal_db,$(COMPOSE)); \
		COMPOSE_PROFILES=$$profiles $(COMPOSE) up -d --build --wait --remove-orphans || \
			{ echo "✗ une app n'est pas devenue saine — les services restent en marche ; make logs s=<app> pour investiguer"; exit 1; }; \
	fi
	@if [ -t 0 ] && [ -t 1 ]; then $(MAKE) --no-print-directory tui; fi

down: ## Stoppe tout (les données sont conservées ; worktree : sa stack d'apps seulement)
	@$(compose_here); $$C --profile '*' down

# Le cache persistant de Turbopack (.next) indexe les fichiers sources : un
# fichier supprimé/déplacé hors watcher (rebase, changement de branche) laisse
# une référence fantôme qui fait planter le build tailwind/postcss au démarrage.
cache-clean: ## Vide les caches de build (.next, nx, node_modules/.cache) et redémarre les apps concernées
	@echo "🧹 purge des caches de build"
	@rm -rf apps/app/.next apps/site/.next node_modules/.cache
	@-pnpm nx reset >/dev/null 2>&1
	@rm -rf .nx/cache
	@$(compose_here); running=$$($$C --profile '*' ps --status running --format '{{.Service}}' | grep -E '^(app|site)$$' || true); \
	if [ -n "$$running" ]; then echo "🔄 redémarrage :" $$running; $$C --profile '*' restart $$running; \
	else echo "ℹ aucune app en cours — caches purgés"; fi

logs: ## Suit les logs : make logs [s=<service>] (ex. s=backend, s=nx-daemon)
	@$(compose_here); $$C --profile '*' logs -f -n 100 $(s)

ps: ## Liste les conteneurs de la stack
	@$(compose_here); $$C --profile '*' ps -a

workflow-graph: ## Diagramme mermaid d'un workflow du domaine (choix interactif parmi les *.workflow.ts)
	@pnpm tsc --build packages/domain/tsconfig.lib.json
	@node scripts/workflow-graph.mts

tui: ensure-deps ## Tableau de bord interactif de la stack : statuts, URLs, logs, start/stop/restart (q pour quitter)
	@if [ -n "$(IS_WORKTREE)" ]; then \
		slot=$$(sed -n 's/^TET_PORT_SLOT=//p' .env.local 2>/dev/null); \
		COMPOSE_PROJECT_NAME=tet-wt$$slot COMPOSE_FILE=docker-compose.yml:docker-compose.worktree.yml \
			DOCKER="$(DOCKER)" node scripts/dev-tui.mts; \
	else DOCKER="$(DOCKER)" node scripts/dev-tui.mts; fi

## —— 🗄️  Base de données —————————————————————————————————————————————————————
db-init: guard-main preflight-env-keys services-up db-migrate db-import-referentiels db-seed ## Initialise la base de zéro : services + migrations + référentiels + données de test
	@echo "✓ base prête — lancez les apps avec make dev (host) ou make up (docker)"

db-migrate: warn-shared-db ## Applique les migrations sqitch
	$(COMPOSE) --profile dbtools --profile supabase run --rm --build -T sqitch deploy --mode change

# Comme en CI, les seeds supposent les référentiels déjà importés (les tables
# banatic_2025_competence, action…, remplies par db-import-referentiels).
db-seed: warn-shared-db ## Charge les données de test si la base est vide
	@count=$$($(COMPOSE) exec -T db psql -U postgres -tAc 'select count(*) from collectivite' 2>/dev/null || echo -1); \
	if [ "$$count" = "0" ]; then \
		{ $(COMPOSE) --profile dbtools --profile supabase run --rm -T seeder seed/seed.sh && \
		  $(COMPOSE) --profile dbtools --profile supabase run --rm -T seeder seed/geojson.sh; } || \
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

# Certains seeds de data_layer/seed/imports/ sont dérivés de sources publiques
# (data.gouv.fr, BANATIC…) plutôt qu'écrits à la main : un générateur
# data_layer/scripts/generate_*.py par fichier, découvert par ce wildcard.
# Ajouter une source = déposer un script respectant ce nom, rien à câbler ici.
SEED_GENERATORS = $(wildcard data_layer/scripts/generate_*.py)

# Ne touche pas la base : réécrit des fichiers du dépôt, à committer ensuite
# (make db-reset, ou db-init sur une base neuve, les rejoue via seed.sh).
seeds_rebuild_from_source: ## Régénère les seeds dérivés de sources publiques (télécharge data.gouv.fr) puis à committer
	@$(colored); command -v python3 >/dev/null 2>&1 || \
		{ red "✗ python3 introuvable — requis par les générateurs de seeds"; exit 1; }; \
	test -n "$(SEED_GENERATORS)" || { yellow "aucun générateur dans data_layer/scripts/"; exit 0; }; \
	for gen in $(SEED_GENERATORS); do \
		blue "⏳ $$gen"; \
		python3 "$$gen" || { red "✗ échec de $$gen — seed laissé intact"; exit 1; }; \
	done; \
	green "✓ relisez le diff (git diff --stat data_layer/seed/imports) avant de committer"

## —— 📰 CMS Strapi ———————————————————————————————————————————————————————————
cms-pull: guard-main ## ⚠ Remplace le contenu Strapi local par celui de l'instance distante
	@$(call decrypt_env,$(ENV_ROOT)) -- sh -c '\
		test -n "$$STRAPI_REMOTE_URL" && test -n "$$STRAPI_TRANSFER_TOKEN" || \
			{ echo "✗ STRAPI_REMOTE_URL / STRAPI_TRANSFER_TOKEN indisponibles dans $(ENV_ROOT)"; \
			  echo "  (transfer token ≠ API token : à créer sur le remote dans Settings → Transfer tokens, permission pull)"; exit 1; }; \
		$(COMPOSE) stop strapi && \
		$(COMPOSE) run --rm -T strapi \
			npm run strapi -- transfer --from "$${STRAPI_REMOTE_URL%/}/admin" --from-token "$$STRAPI_TRANSFER_TOKEN" --force --exclude files; \
		status=$$?; $(COMPOSE) up -d strapi && exit $$status'
	@node scripts/strapi-localize-uploads.mts

## —— 🧑‍💻 Développement ———————————————————————————————————————————————————————
install: preflight-env-keys ## Installe les dépendances (token Bryntum injecté depuis le .env racine) et compile canvas et supabase
	@$(if $(IS_WORKTREE),node scripts/worktree-env.mts,true)
	@$(call decrypt_env,$(ENV_ROOT)) -- sh -c '\
		case "$$BRYNTUM_ACCESS_TOKEN" in ""|encrypted:*) echo "✗ BRYNTUM_ACCESS_TOKEN vide ou indéchiffrable dans $(ENV_ROOT) (clé .env.keys manquante ?)"; exit 1;; esac; \
		pnpm install && pnpm rebuild canvas supabase'

lint: preflight-env-keys ## Reproduit le job CI lint sur l'ensemble des projets
	@if [ -n "$(files)" ]; then \
		$(call run_node,node scripts/lint-files.mts $(files)); \
	else \
		$(call run_node,pnpm exec nx run-many -t lint -- --quiet); \
	fi

test: preflight-env-keys ## Lance les tests : make test [project=<nx-project>]
	@$(call run_node,pnpm exec nx $(if $(project),test "$(project)",run-many -t test))

hooks: ## Active les hooks git du dépôt (.githooks)
# PIÈGE : git config --get sort en 1 quand la clé est absente. Sous set -e, une
# affectation par substitution prend le code de la substitution et tue le shell
# avant la lecture de $?. On capture donc le code via la condition d'un if, seul
# contexte où set -e tolère un échec.
	@set -e; \
	if current=$$(git config --local --get core.hooksPath 2>/dev/null); then ret=0; else ret=$$?; fi; \
	case $$ret in \
		0) ;; \
		1) current='' ;; \
		*) exit $$ret ;; \
	esac; \
	if [ "$$current" != '.githooks' ]; then \
		git config --local $(hooks_path_backup_present_key) $$([ $$ret -eq 0 ] && printf true || printf false) && \
		git config --local $(hooks_path_backup_key) "$$current"; \
	fi
	@chmod +x .githooks/pre-commit
	@git config --local core.hooksPath .githooks
	@echo "✓ hooks git activés (.githooks)"

hooks-off: ## Désactive les hooks git du dépôt
	@set -e; \
	if present=$$(git config --local --get $(hooks_path_backup_present_key) 2>/dev/null); then ret=0; else ret=$$?; fi; \
	case $$ret in \
		0) ;; \
		1) present='' ;; \
		*) exit $$ret ;; \
	esac; \
	if [ "$$present" = true ]; then \
		backup=$$(git config --local --get $(hooks_path_backup_key)); \
		git config --local core.hooksPath "$$backup"; \
	elif [ "$$present" = false ]; then \
		git config --local --unset core.hooksPath; \
	else \
		if current=$$(git config --local --get core.hooksPath 2>/dev/null); then current_ret=0; else current_ret=$$?; fi; \
		case $$current_ret in \
			0) if [ "$$current" = '.githooks' ]; then git config --local --unset core.hooksPath; fi ;; \
			1) true ;; \
			*) exit $$current_ret ;; \
		esac; \
	fi; \
	if git config --local --get $(hooks_path_backup_present_key) >/dev/null 2>&1; then git config --local --unset-all $(hooks_path_backup_present_key); fi; \
	if git config --local --get $(hooks_path_backup_key) >/dev/null 2>&1; then git config --local --unset-all $(hooks_path_backup_key); fi
	@echo "✓ hooks git du dépôt désactivés"

dev: preflight-env-keys ensure-deps ## Lance les apps cochées sur l'hôte : make dev [apps=app,backend] [infra=skip]
	@$(if $(IS_WORKTREE),node scripts/worktree-env.mts,true)
	@apps=$$(node scripts/dev-apps.mts apps $(apps)) || exit 1; \
	if [ "$(infra)" != "skip" ]; then $(MAKE) --no-print-directory infra-up apps="$$apps" || exit 1; fi; \
	DOTENVX="$(DOTENVX)" node scripts/dev-apps.mts run $$apps

# Calcul statique (lecture des targets/dependsOn), rien à exécuter : tourne
# sur l'hôte quel que soit le mode (host/docker), sans lien avec le daemon nx
# partagé des conteneurs (qui sert à l'exécution des tâches, pas au graphe).
graph: ensure-deps ## Ouvre le graphe des dépendances (make graph view=tasks pour le graphe de tâches)
	@pnpm exec nx graph --view=$(or $(view),projects)

worktree: ## Crée un worktree prêt à l'emploi : make worktree [t=feature|bugfix|hotfix|release|chore n=nom-du-sujet]
	@node scripts/new-worktree.mts "$(t)" "$(n)"

worktree-env: ## Prépare un worktree : slot de ports, .env.local, .env.keys (auto via make dev)
	@node scripts/worktree-env.mts

worktree-prune: ## Nettoie les stacks docker des worktrees supprimés (projets tet-wt* fantômes)
	@DOCKER="$(DOCKER)" node scripts/prune-worktree-stacks.mts

infra-up:
	@profiles=$$(node scripts/dev-apps.mts infra $(apps)) || exit 1; \
	if [ -n "$(IS_WORKTREE)" ]; then \
		COMPOSE_PROFILES=$$profiles $(MAKE) -C $(MAIN_ROOT) --no-print-directory services-scoped-up; \
	else COMPOSE_PROFILES=$$profiles $(COMPOSE) up -d --wait; fi

services-scoped-up:
	@$(call heal_db,$(COMPOSE))
	$(COMPOSE) up -d --wait
