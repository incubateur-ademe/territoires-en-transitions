# Versionné : aucune valeur secrète ici. Le token Coolify arrive par
# TF_VAR_coolify_token (scripts/coolify-env.sh).
#
# Prérequis : les stacks platform, nonprod, prod et preview sont appliqués (les
# serveurs et leurs clés d'hôte sont lus par data source, cf. main.tf), et
# l'opérateur qui applique est connecté au VPN.
#
#   source infra/scripts/tf-env.sh
#   source infra/scripts/coolify-env.sh

project_id      = "ddfb298c-fbcf-4b11-a133-76200482002d"
prod_project_id = "ab89df2d-0d28-4b5b-9ad8-74e5160e9a31"

# Instance Coolify de l'incubateur (notre Team).
coolify_endpoint = "https://ops.incubateur.ademe.fr/api/v1"

# À incrémenter après rotation du PAT GHCR (nouvelle version du secret
# tet-platform-ghcr-pull) : force un nouveau docker login sur les serveurs.
ghcr_pull_credentials_revision = "2"

# Incrémenter après chaque nouvelle version de secret dans Secret Manager.
coolify_env_revision = "5"
