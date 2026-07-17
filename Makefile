-include Makefile.local

DOTENVX ?= npx -y @dotenvx/dotenvx
ENV_KEYS = --env-keys-file=.env.keys

ENV_ROOT = .env

env_flags = $(foreach f,$(1),$(foreach g,$(wildcard $(f).local $(f)),-f $(g)))
# --strict : dotenvx sort en erreur (code 1) si une variable ne peut pas être
# déchiffrée (clé .env.keys manquante), la commande n'est alors jamais lancée.
decrypt_env = $(DOTENVX) run $(ENV_KEYS) --strict $(call env_flags,$(1))

# Fichier .env ciblé par env-set/env-get : celui de l'app si app= est fourni,
# sinon choix interactif parmi les .env du monorepo (scripts/pick-env-file.mjs).
env_target = $(if $(app),apps/$(app)/.env,$$(node scripts/pick-env-file.mjs))

.DEFAULT_GOAL = help
.PHONY: help env-set env-get \
        install dev dev-app dev-backend dev-site dev-panier

help: ## Affiche cette aide
	@grep -E '(^[a-zA-Z0-9_-]+:.*?##.*$$)|(^##)' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}{printf "\033[32m%-15s\033[0m %s\n", $$1, $$2}' | sed -e 's/\[32m##/[33m/'

## —— 🔐 Variables d'environnement ———————————————————————————————————————————
env-set: export ENV_ENTRY = $(or $(e),$(k)=$(v))
env-set: ## Définit une valeur chiffrée : make env-set e=CLE=valeur [app=backend]
	@f=$(env_target) && test -n "$$f" && test "$$ENV_ENTRY" != "=" && \
	$(DOTENVX) set "$${ENV_ENTRY%%=*}" -f $$f $(ENV_KEYS) -- "$${ENV_ENTRY#*=}"

env-get: ## Lit une valeur déchiffrée : make env-get k=CLE [app=backend]
	@f=$(env_target) && test -n "$$f" && $(DOTENVX) get $(k) -f $$f $(ENV_KEYS)

## —— 🧑‍💻 Développement ———————————————————————————————————————————————————————
install: ## Installe les dépendances (token Bryntum injecté depuis le .env racine) et compile canvas et supabase
	@$(call decrypt_env,$(ENV_ROOT)) -- sh -c '\
		case "$$BRYNTUM_ACCESS_TOKEN" in ""|encrypted:*) echo "✗ BRYNTUM_ACCESS_TOKEN vide ou indéchiffrable dans $(ENV_ROOT) (clé .env.keys manquante ?)"; exit 1;; esac; \
		pnpm install && pnpm rebuild canvas supabase'

dev: ## Lance toutes les apps (app, auth, panier, site, backend)
	$(call decrypt_env,apps/app/.env apps/auth/.env apps/panier/.env apps/site/.env apps/backend/.env $(ENV_ROOT)) -- pnpm dev

dev-app: ## Lance app + auth + backend
	$(call decrypt_env,apps/app/.env apps/auth/.env apps/backend/.env $(ENV_ROOT)) -- pnpm dev:app

dev-backend: ## Lance le backend seul
	$(call decrypt_env,apps/backend/.env $(ENV_ROOT)) -- pnpm dev:backend

dev-site: ## Lance le site seul
	$(call decrypt_env,apps/site/.env $(ENV_ROOT)) -- pnpm dev:site

dev-panier: ## Lance le panier seul
	$(call decrypt_env,apps/panier/.env $(ENV_ROOT)) -- pnpm dev:panier
