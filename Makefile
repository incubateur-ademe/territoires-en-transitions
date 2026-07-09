-include Makefile.local

DOCKER ?= docker
COMPOSE = $(DOCKER) compose
DOTENVX ?= npx -y @dotenvx/dotenvx
ENV_KEYS = --env-keys-file=.env.keys

ENV_ROOT = .env

env_flags = $(foreach f,$(1),$(foreach g,$(wildcard $(f).local) $(wildcard $(f)),-f $(g)))
# --strict : dotenvx sort en erreur (code 1) si une variable ne peut pas être
# déchiffrée (clé .env.keys manquante), la commande n'est alors jamais lancée.
decrypt_env = $(DOTENVX) run $(ENV_KEYS) --strict $(call env_flags,$(1))

# Fichier .env ciblé par env-set/env-get : celui de l'app si app= est fourni,
# sinon choix interactif parmi les .env du monorepo (scripts/pick-env-file.mjs).
env_target = $(if $(app),apps/$(app)/.env,$$(node scripts/pick-env-file.mjs))

.DEFAULT_GOAL = help
.PHONY: help env-set env-get \
        install dev dev-app dev-backend dev-site dev-panier \
        up down logs ps \
        db-init db-migrate db-seed db-reset db-shell db-import-referentiels \
        cms-pull

help: ## Affiche cette aide
	@grep -E '(^[a-zA-Z0-9_-]+:.*?##.*$$)|(^##)' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}{printf "\033[32m%-15s\033[0m %s\n", $$1, $$2}' | sed -e 's/\[32m##/[33m/'

## —— 🔐 Variables d'environnement ———————————————————————————————————————————
env-set: export ENV_ENTRY = $(or $(e),$(k)=$(v))
env-set: ## Définit une valeur chiffrée : make env-set e=CLE=valeur [app=backend]
	@f=$(env_target) && test -n "$$f" && test "$$ENV_ENTRY" != "=" && \
	$(DOTENVX) set "$${ENV_ENTRY%%=*}" -f $$f $(ENV_KEYS) -- "$${ENV_ENTRY#*=}"

env-get: ## Lit une valeur déchiffrée : make env-get k=CLE [app=backend]
	@f=$(env_target) && test -n "$$f" && $(DOTENVX) get $(k) -f $$f $(ENV_KEYS)

## —— 🐳 Infra locale (Supabase, Redis) ———————————————————————————————————————
up: ## Démarre l'infra et attend qu'elle soit prête
	$(COMPOSE) up -d --wait

down: ## Stoppe l'infra (les données sont conservées)
	$(COMPOSE) down

logs: ## Suit les logs de l'infra : make logs [s=auth]
	$(COMPOSE) logs -f -n 100 $(s)

ps: ## Liste les conteneurs de l'infra
	$(COMPOSE) ps -a

## —— 🗄️  Base de données —————————————————————————————————————————————————————
db-init: up db-migrate db-import-referentiels db-seed ## Initialise la base de zéro : infra + migrations + référentiels + données de test
	@echo "✓ base prête — lancez les apps avec make dev"

db-migrate: ## Applique les migrations sqitch
	$(COMPOSE) --profile tools run --rm --build sqitch deploy --mode change

# Comme en CI, les seeds supposent les référentiels déjà importés (les tables
# banatic_2025_competence, action…, remplies par db-import-referentiels).
db-seed: ## Charge les données de test si la base est vide
	@count=$$($(COMPOSE) exec db psql -U postgres -tAc 'select count(*) from collectivite' 2>/dev/null || echo -1); \
	if [ "$$count" = "0" ]; then \
		{ $(COMPOSE) --profile tools run --rm seeder seed/seed.sh && \
		  $(COMPOSE) --profile tools run --rm seeder seed/geojson.sh; } || \
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
db-reset: down db-rm-volume db-init ## ⚠ Détruit les données locales puis réinitialise la base
db-shell: ## Ouvre psql dans la base locale
	$(COMPOSE) exec db psql -U postgres

## —— 📰 CMS Strapi ———————————————————————————————————————————————————————————
# Le transfert tourne dans le conteneur mais hors du serveur dev : les deux ne
# peuvent pas se partager la base. Attention, un « API token » ne suffit pas :
# il faut un « transfer token » créé sur l'instance distante (Settings →
# Transfer tokens, permission pull), à stocker avec
#   make env-set e=STRAPI_TRANSFER_TOKEN=<token>
cms-pull: ## ⚠ Remplace le contenu Strapi local par celui de l'instance distante
	@$(call decrypt_env,$(ENV_ROOT)) -- sh -c '\
		test -n "$$STRAPI_REMOTE_URL" && test -n "$$STRAPI_TRANSFER_TOKEN" || \
			{ echo "✗ STRAPI_REMOTE_URL / STRAPI_TRANSFER_TOKEN indisponibles dans $(ENV_ROOT)"; \
			  echo "  (transfer token ≠ API token : à créer sur le remote dans Settings → Transfer tokens, permission pull)"; exit 1; }; \
		$(COMPOSE) stop strapi && \
		$(COMPOSE) run --rm strapi \
			npm run strapi -- transfer --from "$${STRAPI_REMOTE_URL%/}/admin" --from-token "$$STRAPI_TRANSFER_TOKEN" --force; \
		status=$$?; $(COMPOSE) up -d strapi && exit $$status'

## —— 🧑‍💻 Développement ———————————————————————————————————————————————————————
install: ## Installe les dépendances (token Bryntum injecté depuis le .env racine) et compile canvas et supabase
	@$(call decrypt_env,$(ENV_ROOT)) -- sh -c '\
		case "$$BRYNTUM_ACCESS_TOKEN" in ""|encrypted:*) echo "✗ BRYNTUM_ACCESS_TOKEN vide ou indéchiffrable dans $(ENV_ROOT) (clé .env.keys manquante ?)"; exit 1;; esac; \
		pnpm install && pnpm rebuild canvas supabase'

dev: ## Lance toutes les apps (app, panier, site, backend)
	$(call decrypt_env,apps/app/.env apps/panier/.env apps/site/.env apps/backend/.env $(ENV_ROOT)) -- pnpm dev

dev-app: ## Lance app + backend
	$(call decrypt_env,apps/app/.env apps/backend/.env $(ENV_ROOT)) -- pnpm dev:app

dev-backend: ## Lance le backend seul
	$(call decrypt_env,apps/backend/.env $(ENV_ROOT)) -- pnpm dev:backend

dev-site: ## Lance le site seul
	$(call decrypt_env,apps/site/.env $(ENV_ROOT)) -- pnpm dev:site

dev-panier: ## Lance le panier seul
	$(call decrypt_env,apps/panier/.env $(ENV_ROOT)) -- pnpm dev:panier
