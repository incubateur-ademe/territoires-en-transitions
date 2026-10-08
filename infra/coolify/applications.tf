# --- Applications ---
#
# Les applications « image Docker » de chaque environnement : leur forme
# (image, domaines, port, healthcheck), pas leur version. Le tag d'image
# appartient à la CD (scripts/coolify-deploy.sh) ; Terraform ne le pose qu'à la
# création. Les variables d'environnement suivent leur propre chemin (cf.
# doc/plans/2026-09-25-001-infra-env-vars-secret-manager-vers-coolify-plan.md).
#
# sierrajc/coolify n'a pas de ressource coolify_application : création et mise
# à jour passent par scripts/coolify-upsert-application.sh, comme les serveurs.

locals {
  # Ce qui ne dépend pas de l'environnement.
  #
  # health_path vide : pas de check HTTP Coolify, le HEALTHCHECK de l'image
  # suffit (apps/app/Dockerfile en porte un, sur /api/version).
  application_catalog = {
    app = {
      image       = "ghcr.io/incubateur-ademe/tet-app"
      port        = 3000
      health_path = ""
    }
    backend = {
      image       = "ghcr.io/incubateur-ademe/tet-backend"
      port        = 3000
      health_path = "/version"
    }
    site = {
      image       = "ghcr.io/incubateur-ademe/tet-site"
      port        = 3000
      health_path = "/"
    }
  }

  # Ce qui en dépend : projet, serveur (tier) et domaines servis.
  #
  # Les noms de prod restent chez le registrar actuel : les ajouter ici avant
  # la bascule DNS ferait tenter à Traefik des certificats Let's Encrypt sur des
  # noms qui pointent encore vers Koyeb. C'est var.application_environments qui
  # retient la prod tant qu'elle n'est pas prête.
  application_environments_catalog = {
    preprod = {
      project = "tet-preprod"
      server  = "nonprod"
      domains = {
        app     = ["https://app.preprod.territoiresentransitions.fr"]
        backend = ["https://api.preprod.territoiresentransitions.fr"]
        site    = ["https://preprod.territoiresentransitions.fr"]
      }
    }
    staging = {
      project = "tet-staging"
      server  = "nonprod"
      domains = {
        app     = ["https://app.staging.territoiresentransitions.fr"]
        backend = ["https://api.staging.territoiresentransitions.fr"]
        site    = ["https://staging.territoiresentransitions.fr"]
      }
    }
    prod = {
      project = "tet-prod"
      server  = "prod"
      domains = {
        app     = ["https://app.territoiresentransitions.fr"]
        backend = ["https://api.territoiresentransitions.fr"]
        site    = ["https://territoiresentransitions.fr", "https://www.territoiresentransitions.fr"]
      }
    }
  }

  # Une entrée par couple environnement/application activé, clé « env/app » :
  # c'est aussi l'identifiant du marqueur [tet-app:env/app] dans Coolify.
  applications = merge([
    for env, e in local.application_environments_catalog : {
      for app, domains in e.domains : "${env}/${app}" => merge(local.application_catalog[app], {
        env     = env
        app     = app
        project = e.project
        server  = e.server
        domains = domains
      })
    } if contains(var.application_environments, env)
  ]...)
}

resource "terraform_data" "application" {
  for_each = local.applications

  # Rejoué dès que la forme change. Le tag n'en fait pas partie : il appartient
  # à la CD.
  triggers_replace = [
    jsonencode(each.value),
    coolify_project.env[each.value.project].uuid,
    filesha256("${path.module}/../scripts/coolify-upsert-application.sh"),
  ]

  # Le serveur doit porter son marqueur [tet-server:<tier>] avant qu'on y
  # rattache une application.
  depends_on = [terraform_data.server]

  provisioner "local-exec" {
    command = "${path.module}/../scripts/coolify-upsert-application.sh"
    environment = {
      COOLIFY_ENDPOINT  = var.coolify_endpoint
      APP_ID            = each.key
      APP_NAME          = each.value.app
      APP_DESCRIPTION   = "${each.value.app} ${each.value.env}. Géré par Terraform (infra/coolify/applications.tf)."
      PROJECT_UUID      = coolify_project.env[each.value.project].uuid
      SERVER_TIER       = each.value.server
      APP_IMAGE         = each.value.image
      APP_INITIAL_TAG   = var.application_initial_image_tag
      APP_PORT          = tostring(each.value.port)
      APP_DOMAINS       = join(",", each.value.domains)
      APP_REDIRECT      = "both"
      APP_HEALTH_PATH   = each.value.health_path
      APP_LIMITS_MEMORY = "0"
      # COOLIFY_TOKEN est hérité de l'environnement (coolify-env.sh).
    }
  }
}
