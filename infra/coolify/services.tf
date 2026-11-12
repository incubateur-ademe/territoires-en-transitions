# --- Services (Docker Compose) ---
#
# supabase-api : GoTrue + Storage API, un service Coolify par environnement.
# Le compose (infra/nonprod/supabase-api/docker-compose.yml) est le même
# partout : ce qui varie (STACK_ENV, SUPABASE_API_HOST, URL, secrets) passe par
# ses variables, poussées depuis le manifeste (env-manifest.tf), comme pour les
# applications.
#
# Les templates d'email sont des file storages Coolify créés par l'API
# (terraform_data.supabase_api_templates). Coolify les écrit sous
# /data/coolify/services/<uuid>/etc/gotrue/templates sans les monter : le
# service templates du compose les monte et les sert en HTTP à GoTrue, qui ne
# lit pas de fichier local.
# La clé `content:` du compose ne convient pas : Coolify l'en extrait, et le
# provider échoue sur un compose relu différent de celui envoyé. Le compose ne
# porte aucun secret (que des ${VAR}) : son passage dans le state n'expose rien.
#
# STACK_ENV et SUPABASE_API_HOST sont remplacés ici par leur valeur : Coolify
# échappe les $ des labels ($${VAR}), Traefik recevait la règle
# Host(`${SUPABASE_API_HOST…}`) telle quelle et ne routait rien.
locals {
  supabase_api_dir = "${path.module}/../nonprod/supabase-api"

  supabase_api_compose_raw = file("${local.supabase_api_dir}/docker-compose.yml")

  # Hôte servi par environnement. Les noms de prod restent hors de
  # var.application_environments jusqu'à la bascule DNS (cf. applications.tf).
  service_environments_catalog = {
    preprod = { server = "nonprod", supabase_api_host = "supabase-api.preprod.territoiresentransitions.fr" }
    staging = { server = "nonprod", supabase_api_host = "supabase-api.staging.territoiresentransitions.fr" }
    prod    = { server = "prod", supabase_api_host = "supabase-api.territoiresentransitions.fr" }
  }

  # Clé « env/service » : identifiant du marqueur (tet-service=env/service).
  services = {
    for env, e in local.service_environments_catalog : "${env}/supabase-api" => {
      env               = env
      app               = "supabase-api"
      server            = e.server
      supabase_api_host = e.supabase_api_host
      docker_compose_raw = replace(
        replace(local.supabase_api_compose_raw, "/\\$\\{STACK_ENV(:\\?[^}]*)?\\}/", env),
      "/\\$\\{SUPABASE_API_HOST(:\\?[^}]*)?\\}/", e.supabase_api_host)
    } if contains(var.application_environments, env)
  }
}

# Pas d'urls : le routage /auth/v1 et /storage/v1 est porté par les labels
# Traefik du compose ; un domaine Coolify ajouterait un second routeur.
resource "coolify_service" "supabase_api" {
  for_each = local.services

  name             = "supabase-api"
  description      = "GoTrue + Storage API ${each.value.env}. Géré par Terraform (infra/coolify/services.tf). (tet-service=${each.key})"
  project_uuid     = coolify_project.tet.uuid
  server_uuid      = coolify_server.app[each.value.server].uuid
  environment_name = local.coolify_environment_names[each.value.env]

  docker_compose_raw = each.value.docker_compose_raw
  # Rien ne démarre à la création : les variables ne sont pas encore poussées.
  instant_deploy = false

  depends_on = [coolify_environment.env]
}

# Templates d'email de GoTrue, servis par le service templates du compose
# (URLs des GOTRUE_MAILER_TEMPLATES_*). Rejoué quand un template change.
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

# --- Alloy : collecte d'observabilité, un service par serveur ---
#
# Pousse vers Cockpit les métriques de l'hôte, des conteneurs, de Traefik, les
# sondes HTTPS et les logs des conteneurs (infra/observability/alloy). Un seul
# Alloy par serveur : il voit tous les conteneurs de l'hôte. Il est rattaché à
# un environnement Coolify (celui de ses sondes) parce qu'un service doit
# l'être. Staging, qui partage le serveur nonprod, n'aura à ajouter que ses
# sondes.
locals {
  alloy_dir = "${path.module}/../observability/alloy"

  # Un par serveur, indépendamment de application_environments : aldo tourne
  # sur le serveur prod avant les applications TET. Seule liste à compléter
  # pour un nouveau serveur : service, variables et sondes en découlent.
  alloy_environments = ["preprod", "prod"]

  alloy_services = {
    for env in local.alloy_environments : "${env}/alloy" => {
      env    = env
      app    = "alloy"
      server = local.service_environments_catalog[env].server
    }
  }

  # Sondes HTTPS : une par ressource déclarée, sur son premier domaine. Elles
  # suivent donc les catalogues (une application ajoutée est sondée). Le nom
  # porte l'environnement : blackbox veut des noms uniques, et un serveur peut
  # héberger plusieurs environnements.
  alloy_probes = concat(
    [for id, a in local.applications : {
      server  = a.server, env = a.env, name = "${a.env}-${a.app}", service = a.app
      address = "${a.domains[0]}${a.probe_path}"
    }],
    flatten([for id, s in local.services : [
      for name, c in { auth = { container = "gotrue", path = "/auth/v1/health" }, storage = { container = "storage", path = "/storage/v1/status" } } : {
        server              = s.server, env = s.env, name = "${s.env}-${name}", service = s.app, container = c.container
        address             = "https://${s.supabase_api_host}${c.path}"
      }
    ]]),
    # Un domaine encore déclaré en http:// pointe vers l'ancien hébergeur
    # (git-applications.tf) : pas de sonde avant la bascule DNS.
    [for id, a in local.git_applications : {
      server  = a.server, env = a.env, name = "${a.env}-${a.app}", service = a.app
      address = "${a.domains[0]}${a.probe_path}"
    } if startswith(a.domains[0], "https://")],
  )

  # Variables de chaque Alloy (compose infra/observability/alloy), par
  # environnement : fusionnées dans coolify_env_manifests (env-manifest.tf).
  # Dans PROBE_TARGETS, env vaut le nom de l'environnement Coolify, comme le
  # label des conteneurs.
  alloy_env_manifests = {
    for id, s in local.alloy_services : s.env => merge(local.coolify_env_common.alloy, {
      SERVER_NAME = { value = var.app_servers[s.server].name }
      PROBE_TARGETS = { value = jsonencode([
        for p in local.alloy_probes : merge(
          { for k, v in p : k => v if k != "server" },
          { module = "https_2xx", env = local.coolify_environment_names[p.env] },
        ) if p.server == s.server
      ]) }
    })
  }
}

resource "coolify_service" "alloy" {
  for_each = local.alloy_services

  name             = "alloy"
  description      = "Agent Grafana Alloy du serveur ${each.value.server}, vers Cockpit. Géré par Terraform (infra/coolify/services.tf). (tet-service=${each.key})"
  project_uuid     = coolify_project.tet.uuid
  server_uuid      = coolify_server.app[each.value.server].uuid
  environment_name = local.coolify_environment_names[each.value.env]

  docker_compose_raw = file("${local.alloy_dir}/docker-compose.yml")
  # Rien ne démarre à la création : les variables ne sont pas encore poussées.
  instant_deploy = false

  depends_on = [coolify_environment.env]
}

# config.alloy, monté dans /etc/alloy. Rejoué quand il change ; effectif au
# prochain redémarrage du service.
resource "terraform_data" "alloy_config" {
  for_each = coolify_service.alloy

  triggers_replace = [
    each.value.uuid,
    filesha256("${local.alloy_dir}/config.alloy"),
    filesha256("${path.module}/../scripts/coolify-upsert-service-files.sh"),
  ]

  provisioner "local-exec" {
    command = "${path.module}/../scripts/coolify-upsert-service-files.sh"
    environment = {
      COOLIFY_ENDPOINT = var.coolify_endpoint
      SERVICE_UUID     = each.value.uuid
      SUB_RESOURCE     = "alloy"
      FILES_DIR        = local.alloy_dir
      FILES_GLOB       = "*.alloy"
      MOUNT_DIR        = "/etc/alloy"
      # COOLIFY_TOKEN hérité de l'environnement (coolify-env.sh).
    }
  }
}
