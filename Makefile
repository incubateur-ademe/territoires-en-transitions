-include Makefile.local

DOTENVX ?= npx -y @dotenvx/dotenvx
ENV_KEYS = --env-keys-file=.env.keys

ENV_ROOT = .env

env_flags = $(foreach f,$(1),$(foreach g,$(wildcard $(f).local $(f)),-f $(g)))
decrypt_env = $(DOTENVX) run $(ENV_KEYS) $(call env_flags,$(1))

# Fichier .env ciblé par env-set/env-get : celui de l'app si app= est fourni,
# sinon le .env racine.
env_target = $(if $(app),apps/$(app)/.env,$(ENV_ROOT))

.DEFAULT_GOAL = help
.PHONY: help env-set env-get \
        install dev dev-app dev-backend dev-site dev-panier

help: ## Affiche cette aide
	@grep -E '(^[a-zA-Z0-9_-]+:.*?##.*$$)|(^##)' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}{printf "\033[32m%-15s\033[0m %s\n", $$1, $$2}' | sed -e 's/\[32m##/[33m/'

## —— 🔐 Variables d'environnement ———————————————————————————————————————————
env-set: export ENV_ENTRY = $(or $(e),$(k)=$(v))
env-set: ## Définit une valeur chiffrée : make env-set e=CLE=valeur [app=backend]
	@f=$(env_target) && test -n "$$f" && test "$$ENV_ENTRY" != "=" && \
	$(DOTENVX) set "$${ENV_ENTRY%%=*}" "$${ENV_ENTRY#*=}" -f $$f $(ENV_KEYS)

env-get: ## Lit une valeur déchiffrée : make env-get k=CLE [app=backend]
	@$(DOTENVX) get $(k) -f $(env_target) $(ENV_KEYS)

## —— 🧑‍💻 Développement ———————————————————————————————————————————————————————
install: ## Installe les dépendances (token Bryntum injecté depuis le .env racine) et compile canvas et supabase
	@$(call decrypt_env,$(ENV_ROOT)) -- sh -c '\
		test -n "$$BRYNTUM_ACCESS_TOKEN" || { echo "✗ BRYNTUM_ACCESS_TOKEN vide ou indéchiffrable dans $(ENV_ROOT) (clé .env.keys manquante ?)"; exit 1; }; \
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
