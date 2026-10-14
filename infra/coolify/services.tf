# --- Services (Docker Compose) ---
#
# supabase-api : GoTrue + Storage API, un service Coolify par environnement.
# Le compose (infra/nonprod/supabase-api/docker-compose.yml) est le même
# partout : ce qui varie (STACK_ENV, SUPABASE_API_HOST, URL, secrets) passe par
# ses variables, poussées depuis le manifeste (env-manifest.tf), comme pour les
# applications.
#
# Les templates d'email sont montés depuis ./templates/, qui n'existe pas sur
# le serveur : on retire ce volume du compose, et les templates deviennent des
# file storages Coolify créés par l'API (terraform_data.supabase_api_templates).
# La clé `content:` du compose ne convient pas : Coolify l'en extrait, et le
# provider échoue sur un compose relu différent de celui envoyé. Le compose ne
# porte aucun secret (que des ${VAR}) : son passage dans le state n'expose rien.
locals {
  supabase_api_dir = "${path.module}/../nonprod/supabase-api"

  supabase_api_compose = yamldecode(file("${local.supabase_api_dir}/docker-compose.yml"))

  supabase_api_compose_raw = yamlencode(merge(local.supabase_api_compose, {
    services = merge(local.supabase_api_compose.services, {
      gotrue = { for k, v in local.supabase_api_compose.services.gotrue : k => v if k != "volumes" }
    })
  }))

  # Hôte servi par environnement. Les noms de prod restent hors de
  # var.application_environments jusqu'à la bascule DNS (cf. applications.tf).
  service_environments_catalog = {
    preprod = { server = "nonprod", supabase_api_host = "supabase-api.preprod.territoiresentransitions.fr" }
    staging = { server = "nonprod", supabase_api_host = "supabase-api.staging.territoiresentransitions.fr" }
    prod    = { server = "prod", supabase_api_host = "supabase-api.territoiresentransitions.fr" }
  }

  # Clé « env/service » : identifiant du marqueur [tet-service:env/service].
  services = {
    for env, e in local.service_environments_catalog : "${env}/supabase-api" => {
      env               = env
      app               = "supabase-api"
      server            = e.server
      supabase_api_host = e.supabase_api_host
    } if contains(var.application_environments, env)
  }
}

# Pas d'urls : le routage /auth/v1 et /storage/v1 est porté par les labels
# Traefik du compose ; un domaine Coolify ajouterait un second routeur.
resource "coolify_service" "supabase_api" {
  for_each = local.services

  name             = "supabase-api"
  description      = "GoTrue + Storage API ${each.value.env}. Géré par Terraform (infra/coolify/services.tf). [tet-service:${each.key}]"
  project_uuid     = coolify_project.tet.uuid
  server_uuid      = coolify_server.app[each.value.server].uuid
  environment_name = local.coolify_environment_names[each.value.env]

  docker_compose_raw = local.supabase_api_compose_raw
  # Rien ne démarre à la création : les variables ne sont pas encore poussées.
  instant_deploy = false

  depends_on = [coolify_environment.env]
}

# Templates d'email de GoTrue, montés dans /etc/gotrue/templates (chemins des
# GOTRUE_MAILER_TEMPLATES_* du compose). Rejoué quand un template change.
resource "terraform_data" "supabase_api_templates" {
  for_each = coolify_service.supabase_api

  triggers_replace = [
    each.value.uuid,
    sha256(join("", [for f in sort(fileset("${local.supabase_api_dir}/templates", "*.html")) : filesha256("${local.supabase_api_dir}/templates/${f}")])),
    filesha256("${path.module}/../scripts/coolify-upsert-service-files.sh"),
  ]

  provisioner "local-exec" {
    command = "${path.module}/../scripts/coolify-upsert-service-files.sh"
    environment = {
      COOLIFY_ENDPOINT = var.coolify_endpoint
      SERVICE_UUID     = each.value.uuid
      SUB_RESOURCE     = "gotrue"
      FILES_DIR        = "${local.supabase_api_dir}/templates"
      FILES_GLOB       = "*.html"
      MOUNT_DIR        = "/etc/gotrue/templates"
      # COOLIFY_TOKEN hérité de l'environnement (coolify-env.sh).
    }
  }
}
