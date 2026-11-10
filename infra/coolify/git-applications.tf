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
# Ces applications ont leurs propres domaines : elles ne dépendent pas de la
# bascule DNS de TET, d'où une liste à part, hors var.application_environments.
# Une entrée par couple environnement/application, clé « env/app » : c'est
# aussi le marqueur [tet-app:env/app] de coolify-push-env.sh.
locals {
  git_application_catalog = {
    # Écoute sur PORT, 8080 par défaut. Le build convertit les CSV en JSON
    # (npm start).
    aldo = {
      repository = "https://github.com/incubateur-ademe/aldo"
      port       = 8080
    }
    # Next.js derrière un serveur Express (server.js), PORT ou 3000. Les
    # NEXT_PUBLIC_* sont figées au build : Coolify passe aussi les variables
    # au build.
    rencontres = {
      repository = "https://github.com/incubateur-ademe/rencontres-tete"
      port       = 3000
    }
  }

  git_applications_catalog = {
    "preprod/aldo" = {
      branch  = "next"
      domains = ["https://aldo.preprod.territoiresentransitions.fr"]
    }
    "prod/aldo" = {
      branch  = "main"
      domains = ["https://aldo.territoiresentransitions.fr"]
    }
    "prod/rencontres" = {
      branch  = "main"
      domains = ["https://rencontres.territoiresentransitions.fr"]
    }
  }

  git_applications = {
    for id, a in local.git_applications_catalog : id => merge(local.git_application_catalog[split("/", id)[1]], a, {
      env    = split("/", id)[0]
      app    = split("/", id)[1]
      server = split("/", id)[0] == "prod" ? "prod" : "nonprod"
    })
  }
}

resource "coolify_application" "git" {
  for_each = local.git_applications

  name             = each.value.app
  description      = "${each.value.app} ${each.value.env}, construit depuis ${each.value.repository}. Géré par Terraform (infra/coolify/git-applications.tf). [tet-app:${each.key}]"
  project_uuid     = coolify_project.tet.uuid
  server_uuid      = coolify_server.app[each.value.server].uuid
  environment_name = local.coolify_environment_names[each.value.env]

  git_repository = each.value.repository
  git_branch     = each.value.branch
  build_pack     = "railpack"
  ports_exposes  = tostring(each.value.port)

  domains                = join(",", each.value.domains)
  redirect               = "both"
  is_force_https_enabled = true
  noindex_domains        = each.value.env == "prod" ? [] : each.value.domains

  # Pas de curl dans l'image Railpack : comme sur Koyeb, le conteneur démarré
  # suffit.
  health_check_enabled = false
  # Rien n'est déployé à la création : les variables ne sont pas encore poussées.
  instant_deploy = false

  depends_on = [coolify_environment.env]
}
