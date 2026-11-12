# --- Applications construites depuis un dépôt Git ---
#
# Les produits voisins de TET, chacun dans son propre dépôt public (aldo,
# rencontres) : Coolify clone la branche et construit l'image sur le serveur
# cible avec Railpack, comme le faisait le buildpack de Koyeb. Pas d'image GHCR
# ni de CD dans ce repo : un push sur la branche redéploie, via le webhook
# GitHub du dépôt (cf. infra/README.md « Applications Git »).
#
# Railpack plutôt que Nixpacks : aldo exige Node 24 (engines), que Nixpacks,
# en maintenance, ne fournit pas.
#
# ponytail: le build tourne sur le serveur applicatif, à côté des applications
# TET, et le nettoyage Docker nocturne (main.tf) vide son cache. Acceptable pour
# un build de quelques minutes par push sur un PRO2-XS. Si les builds gênent la
# prod : un serveur de build Coolify (is_build_server, use_build_server).
#
# Ces applications ont leurs propres domaines : elles ne dépendent pas de la
# bascule DNS de TET, d'où une liste à part, hors var.application_environments.
# Une entrée par couple environnement/application, clé « env/app » : c'est
# aussi le marqueur (tet-app=env/app) des scripts.
locals {
  git_application_catalog = {
    # Écoute sur PORT, 8080 par défaut. Build et démarrage délèguent aux
    # scripts du dépôt ; healthcheck.ts interroge /healthz (aldo#212).
    aldo = {
      repository           = "https://github.com/incubateur-ademe/aldo"
      port                 = 8080
      build_command        = "npm run build"
      start_command        = "npm start"
      health_check_command = "node healthcheck.ts"
      # Chemin que sonde Alloy sur le premier domaine (services.tf).
      probe_path = "/healthz"
      # ~450 Mo en régime établi sur Koyeb : une fuite ne peut pas affamer les
      # applications TET du serveur. Marge faible : à relever si le conteneur
      # est tué (OOM) au chargement des JSON.
      limits_memory = "512m"
    }
  }

  # Un domaine hors *.preprod se déclare d'abord en http:// : Traefik ne tente
  # aucun certificat Let's Encrypt tant que le nom pointe encore vers Koyeb (les
  # échecs répétés atteindraient la limite de Let's Encrypt). Passer en
  # https:// juste après la bascule DNS (cf. infra/README.md « Applications Git »).
  git_applications_catalog = {
    "preprod/aldo" = {
      branch  = "next"
      domains = ["https://aldo.preprod.territoiresentransitions.fr"]
    }
    "prod/aldo" = {
      branch  = "main"
      domains = ["https://aldo.territoiresentransitions.fr"]
    }
  }

  git_applications = {
    for id, a in local.git_applications_catalog : id => merge(local.git_application_catalog[split("/", id)[1]], a, {
      env    = split("/", id)[0]
      app    = split("/", id)[1]
      server = local.service_environments_catalog[split("/", id)[0]].server
    })
  }
}

resource "coolify_application" "git" {
  for_each = local.git_applications

  name = each.value.app
  # Coolify ≥ 4.7 refuse « [ ] : » dans une description : pas d'URL.
  description      = "${each.value.app} ${each.value.env}, construit depuis ${trimprefix(each.value.repository, "https://github.com/")}. Géré par Terraform (infra/coolify/git-applications.tf). (tet-app=${each.key})"
  project_uuid     = coolify_project.tet.uuid
  server_uuid      = coolify_server.app[each.value.server].uuid
  environment_name = local.coolify_environment_names[each.value.env]

  git_repository = each.value.repository
  git_branch     = each.value.branch
  build_pack     = "railpack"
  build_command  = try(each.value.build_command, null)
  start_command  = try(each.value.start_command, null)
  ports_exposes  = tostring(each.value.port)
  limits_memory  = try(each.value.limits_memory, null)

  domains                = join(",", each.value.domains)
  redirect               = "both"
  is_force_https_enabled = alltrue([for d in each.value.domains : startswith(d, "https://")])
  noindex_domains        = each.value.env == "prod" ? [] : each.value.domains

  # Pas de curl dans l'image Railpack, et le health check `cmd` de Coolify
  # refuse parenthèses et guillemets : chaque dépôt fournit un script node.
  # Coolify n'arrête l'ancien conteneur qu'une fois le nouveau sain.
  health_check_enabled = try(each.value.health_check_command, null) != null
  health_check_type    = "cmd"
  health_check_command = try(each.value.health_check_command, null)
  # manual_webhook_secret_github, secret du webhook de l'étape 3 du README, est
  # un attribut calculé : il entre dans le state. Ce n'est pas une exposition
  # de plus, le state porte déjà les clés SSH root des serveurs (main.tf).
  #
  # Rien n'est déployé à la création : les variables ne sont pas encore poussées.
  instant_deploy = false

  depends_on = [coolify_environment.env]

  lifecycle {
    precondition {
      # Sans manifeste pour l'application, coolify_env_pushes l'ignore : elle
      # serait déployée sans ses variables.
      condition     = contains(keys(try(local.coolify_env_manifests[each.value.env], {})), each.value.app)
      error_message = "${each.key} : pas de manifeste ${each.value.env}/${each.value.app} dans env-manifest.tf (coolify_env_app_manifests et coolify_env_settings)."
    }
  }
}
