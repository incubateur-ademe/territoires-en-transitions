# --- Applications ---
#
# Les applications « image Docker » de chaque environnement : leur forme
# (image, domaines, port, healthcheck), pas leur version. Le tag d'image
# appartient à la CD (scripts/coolify-deploy.sh) ; Terraform ne le pose qu'à la
# création et l'ignore ensuite. Les variables d'environnement suivent leur
# propre chemin (cf.
# doc/plans/2026-09-25-001-infra-env-vars-secret-manager-vers-coolify-plan.md).
#
locals {
  # Ce qui ne dépend pas de l'environnement.
  #
  # health_path vide : pas de check HTTP Coolify, le HEALTHCHECK de l'image
  # suffit (apps/app et apps/backend en portent un sur /version, apps/site sur
  # / — leur image n'a pas curl, et le wget de busybox vise localhost, résolu
  # en ::1 alors que Next n'écoute qu'en IPv4).
  application_catalog = {
    app = {
      image       = "ghcr.io/incubateur-ademe/tet-app"
      port        = 3000
      health_path = ""
    }
    backend = {
      image       = "ghcr.io/incubateur-ademe/tet-backend"
      port        = 3000
      health_path = ""
    }
    site = {
      image       = "ghcr.io/incubateur-ademe/tet-site"
      port        = 3000
      health_path = ""
    }
  }

  # Ce qui en dépend : serveur (tier) et domaines servis. L'environnement
  # Coolify est celui du même nom dans le projet tet (main.tf).
  #
  # Le backend sert aussi app.…/api : les appels du navigateur passent par
  # l'origine de l'app (BACKEND_BROWSER_URL), chemin conservé tel quel
  # (is_stripprefix_enabled = false). Traefik classe
  # les routers par longueur de règle : Host && PathPrefix(/api) passe devant
  # le Host seul de l'app.
  #
  # Les noms de prod restent chez le registrar actuel : les ajouter ici avant
  # la bascule DNS ferait tenter à Traefik des certificats Let's Encrypt sur des
  # noms qui pointent encore vers Koyeb. C'est var.application_environments qui
  # retient la prod tant qu'elle n'est pas prête.
  application_environments_catalog = {
    preprod = {
      server = "nonprod"
      domains = {
        app     = ["https://app.preprod.territoiresentransitions.fr"]
        backend = ["https://api.preprod.territoiresentransitions.fr", "https://app.preprod.territoiresentransitions.fr/api"]
        site    = ["https://preprod.territoiresentransitions.fr"]
      }
    }
    staging = {
      server = "nonprod"
      domains = {
        app     = ["https://app.staging.territoiresentransitions.fr"]
        backend = ["https://api.staging.territoiresentransitions.fr", "https://app.staging.territoiresentransitions.fr/api"]
        site    = ["https://staging.territoiresentransitions.fr"]
      }
    }
    prod = {
      server = "prod"
      domains = {
        app     = ["https://app.territoiresentransitions.fr"]
        backend = ["https://api.territoiresentransitions.fr", "https://app.territoiresentransitions.fr/api"]
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
        server  = e.server
        domains = domains
      })
    } if contains(var.application_environments, env)
  ]...)
}

# Le marqueur [tet-app:env/app] de la description est la clé que
# coolify-push-env.sh et coolify-deploy.sh utilisent pour retrouver
# l'application : il ne bouge pas.
resource "coolify_application_docker_image" "app" {
  for_each = local.applications

  name             = each.value.app
  description      = "${each.value.app} ${each.value.env}. Géré par Terraform (infra/coolify/applications.tf). [tet-app:${each.key}]"
  project_uuid     = coolify_project.tet.uuid
  server_uuid      = coolify_server.app[each.value.server].uuid
  environment_name = local.coolify_environment_names[each.value.env]

  docker_image = each.value.image
  # Posé à la création seulement : ensuite la CD le PATCH à chaque déploiement
  # et Terraform ne doit ni le voir en drift, ni le remettre.
  docker_registry_image_tag = var.application_initial_image_tag
  ports_exposes             = tostring(each.value.port)
  domains                   = join(",", each.value.domains)
  redirect                  = "both"
  is_force_https_enabled    = true
  # Chemin conservé tel quel pour app.…/api (cf. ci-dessus).
  is_stripprefix_enabled = false
  # health_path vide : pas de check HTTP Coolify, le HEALTHCHECK de l'image
  # suffit. Sinon un check HTTP conditionne la bascule de trafic au déploiement.
  health_check_enabled = each.value.health_path != ""
  health_check_path    = each.value.health_path != "" ? each.value.health_path : "/"
  # Rien n'est déployé à la création : les variables ne sont pas encore poussées.
  instant_deploy = false

  # L'environnement doit exister ; « production » vient avec le projet.
  depends_on = [coolify_environment.env]

  lifecycle {
    ignore_changes = [docker_registry_image_tag]
  }
}
