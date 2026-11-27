# --- Previews : une stack compose par pull request ---
#
# Une application « Docker Compose » branchée sur ce dépôt par la GitHub App
# de notre Team : infra/preview/docker-compose.yml porte toute la stack, base
# seedée comprise. Coolify en déploie un exemplaire par PR (projet compose,
# réseau et volumes propres), supprimé à la fermeture.
#
# C'est la CI qui crée et déploie les previews, pour les PR portant le label
# `preview`, une fois leurs images construites (preview-build.yml puis
# preview-deploy.yml, par l'API). Le webhook de Coolify ne fait que les
# supprimer à la fermeture des PR.
#
# Mise en service, dans l'ordre (cf. infra/README.md « Previews ») :
#   1. apply avec preview_github_app_uuid : crée l'application, sans domaines ;
#   2. variables dans Coolify, puis un premier déploiement de la branche : c'est
#      lui qui charge le compose, sans quoi l'API refuse les domaines ;
#   3. apply avec preview_compose_loaded = true : pose les domaines.
#
# Sans preview_github_app_uuid, rien n'est déclaré.

variable "preview_github_app_uuid" {
  description = "UUID Coolify de la GitHub App de notre Team (Sources → GitHub). Null : l'application de preview n'est pas déclarée."
  type        = string
  default     = null
}

variable "preview_git_branch" {
  description = "Branche de l'application de base. Le compose doit y exister : la branche du test tant qu'il n'est pas sur main."
  type        = string
  default     = "main"
}

variable "preview_compose_loaded" {
  description = "À passer à true après le premier déploiement, qui charge le compose : Coolify refuse docker_compose_domains avant."
  type        = bool
  default     = false
}

locals {
  # Domaines de l'application de base. Ceux d'une preview en dérivent par le
  # gabarit « Preview URL Template » de l'application, à régler dans l'UI (le
  # provider ne sait pas l'écrire) sur {{pr_id}}-{{domain}} : le défaut,
  # {{pr_id}}.{{domain}}, sort du wildcard DNS *.preview.
  #
  # Le :<port> est le port d'écoute du conteneur (sinon Coolify route sur le
  # 80). Coolify le retire du domaine et le range à part
  # (domain_port_overrides) ; le provider garde la valeur du HCL depuis 0.1.35.
  preview_compose_domains = {
    # Caddy devant l'app : /api/* au backend, comme app.…/api en prod.
    web      = "https://app.preview.territoiresentransitions.fr:3000"
    backend  = "https://api.preview.territoiresentransitions.fr:3000"
    site     = "https://site.preview.territoiresentransitions.fr:3000"
    supabase = "https://supabase-api.preview.territoiresentransitions.fr:8000"
  }
}

resource "coolify_application_github_app" "preview" {
  count = var.preview_github_app_uuid == null ? 0 : 1

  name             = "stack"
  description      = "Stack de preview par pull request. Géré par Terraform (infra/coolify/preview-application.tf). (tet-app=preview/stack)"
  project_uuid     = coolify_project.tet.uuid
  server_uuid      = coolify_server.app["preview"].uuid
  environment_name = local.coolify_environment_names["preview"]

  github_app_uuid = var.preview_github_app_uuid
  git_repository  = "incubateur-ademe/territoires-en-transitions"
  git_branch      = var.preview_git_branch

  build_pack              = "dockercompose"
  base_directory          = "/infra/preview"
  docker_compose_location = "/docker-compose.yml"
  # Requis par le provider ; les ports réels sont ceux des domaines ci-dessus.
  ports_exposes = "3000"

  # Pas de domaine sslip généré à la création : les domaines viennent de
  # docker_compose_domains, après le premier déploiement.
  autogenerate_domain = false
  docker_compose_domains = var.preview_compose_loaded ? jsonencode([
    for name, domain in local.preview_compose_domains : { name = name, domain = domain }
  ]) : null

  # Un push sur la branche de base ne redéploie rien : seules les previews
  # comptent.
  is_auto_deploy_enabled = false
  # false : activées, le webhook déploierait chaque PR ouverte ou poussée par
  # un membre, avant que ses images n'existent. L'API crée les previews sans
  # ce réglage, et le webhook les supprime quand même à la fermeture.
  is_preview_deployments_enabled = false
  # Jamais de preview pour une PR de fork : son code tournerait sur le serveur,
  # avec les variables de l'application.
  is_pr_deployments_public_enabled = false

  instant_deploy = false

  depends_on = [coolify_environment.env]
}

output "preview_application_uuid" {
  description = "UUID Coolify de l'application de preview, null si elle n'est pas déclarée."
  value       = one(coolify_application_github_app.preview[*].uuid)
}
