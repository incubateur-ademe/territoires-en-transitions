# Couche « Coolify-as-code » : ce qui vit *dans* Coolify, pas chez Scaleway.
#
# L'instance est celle de l'incubateur, partagée : tout ce qui suit vit dans
# notre Team, pilotée par un token root de la Team. Rien ici ne touche
# l'instance elle-même (serveur localhost, réglages, sauvegarde) : c'est le
# travail de son admin.
#
# State distinct des stacks d'infrastructure : cette couche suppose Coolify
# joignable.

locals {
  # Projet où lire la clé SSH de chaque serveur : la prod a le sien.
  server_key_project_ids = {
    for k, v in var.app_servers : k => coalesce(v.ssh_key_project_id, var.project_id)
  }
}

# --- Serveurs applicatifs ---
#
# Une clé par serveur : révoquer l'accès à un serveur compromis ne doit pas
# casser les autres.
data "scaleway_secret_version" "server_key" {
  for_each = var.app_servers

  secret_name = each.value.ssh_key_secret_name
  project_id  = local.server_key_project_ids[each.key]
  revision    = "latest"
}

resource "coolify_private_key" "server" {
  for_each = var.app_servers

  name        = "${each.value.name}-root"
  description = "Clé root du serveur ${each.value.name}. Gérée par Terraform (infra/coolify). Privée dans Secret Manager (${each.value.ssh_key_secret_name})."
  private_key = base64decode(data.scaleway_secret_version.server_key[each.key].data)
}

# L'instance de l'incubateur est hors de nos VPC : Coolify joint chaque
# serveur sur son IP publique, dont le 22 n'est ouvert qu'à elle et au VPN des
# opérateurs (ssh_allowed_ips des stacks de tier).
#
# Le provider supprime un serveur en ?force=true, donc avec toutes les
# ressources qu'il héberge : prevent_destroy. Retirer un tier de app_servers
# est un geste en deux temps, comme pour les secrets : `terraform state rm`
# puis suppression dans l'UI (qui, elle, refuse tant qu'il reste des
# ressources).
#
# Coolify ne renvoie pas private_key_uuid en GET : le provider garde la valeur
# du HCL. Rotation de clé = update in-place, jamais de replace.
resource "coolify_server" "app" {
  for_each = var.app_servers

  name             = each.value.name
  description      = "Tier ${each.key}. Géré par Terraform (infra/${each.key}). (tet-server=${each.key})"
  ip               = each.value.ssh_host
  user             = "root"
  port             = 22
  private_key_uuid = coolify_private_key.server[each.key].uuid
  is_build_server  = false

  lifecycle {
    prevent_destroy = true
  }
}

# Nettoyage Docker (images, conteneurs arrêtés, cache de build), chaque nuit
# quel que soit le disque. Volumes et réseaux inutilisés épargnés : un volume
# détaché peut encore porter des données. Valeurs reprises de l'existant.
resource "coolify_server_docker_cleanup" "app" {
  for_each = coolify_server.app

  server_uuid              = each.value.uuid
  docker_cleanup_frequency = "0 0 * * *"
  docker_cleanup_threshold = 80
  force_docker_cleanup     = true
  delete_unused_volumes    = false
  delete_unused_networks   = false
}

# docker login ghcr.io sur root@serveur — prérequis pour tirer les images
# privées. Coolify 4.4 a une API de login registry, mais le provider mettrait
# le PAT dans le state : le helper monte /root/.docker/config.json en SSH.
#
# Le PAT reste hors state : lecture scw + SSH dans le script (R4). Rejouer
# après rotation : incrémenter ghcr_pull_credentials_revision.
resource "terraform_data" "ghcr_docker_login" {
  for_each = var.app_servers

  triggers_replace = [
    each.value.ssh_host,
    each.value.sshd_host_public_key,
    var.ghcr_pull_secret_name,
    var.ghcr_pull_credentials_revision,
    # Recréation de la clé du serveur ⇒ rejouer le login.
    coolify_private_key.server[each.key].uuid,
  ]

  # Après enregistrement du serveur : inutile d'écrire des credentials sur une
  # machine que Coolify ne pilote pas encore.
  depends_on = [coolify_server.app]

  provisioner "local-exec" {
    command = "${path.module}/../scripts/coolify-ghcr-docker-login.sh"
    environment = {
      TARGET_HOST                  = each.value.ssh_host
      TARGET_HOST_KEY              = each.value.sshd_host_public_key
      SERVER_KEY_SECRET_NAME       = each.value.ssh_key_secret_name
      SERVER_KEY_SECRET_PROJECT_ID = local.server_key_project_ids[each.key]
      GHCR_PULL_SECRET_NAME        = var.ghcr_pull_secret_name
      SECRET_PROJECT_ID            = var.project_id
      # Connexion directe à l'IP publique : l'opérateur qui applique doit être
      # sur le VPN, seule source autorisée avec Coolify.
    }
  }
}

# --- Projet et environnements ---
#
# Un seul projet Coolify, « tet », et un environnement par environnement
# applicatif : c'est le modèle de Coolify (équipe → projet → environnement →
# ressource). Les droits Coolify sont portés par l'équipe, pas par le projet :
# des projets séparés n'isoleraient rien. Chaque environnement garde son
# serveur (applications.tf).
#
# La prod reprend l'environnement « production » que Coolify crée avec le
# projet ; les autres portent le nom de leur environnement applicatif.
locals {
  coolify_environment_names = {
    prod    = "production" # serveur dédié tet-prod-apps, Postgres et Redis managés
    preprod = "preprod"    # gate iso-prod, serveur tet-nonprod-apps, Postgres et Redis managés
    staging = "staging"    # intégration continue de main, serveur tet-nonprod-apps, tout conteneurisé
    preview = "preview"    # previews éphémères par pull request, serveur tet-preview-apps
  }
}

resource "coolify_project" "tet" {
  name        = "tet"
  description = "Territoires en Transitions. Un environnement par environnement applicatif. Géré par Terraform (infra/coolify)."
}

# « production » existe dès la création du projet : pas de ressource pour lui.
# Supprimer un environnement supprime tout ce qu'il contient : prevent_destroy.
resource "coolify_environment" "env" {
  for_each = { for k, v in local.coolify_environment_names : k => v if v != "production" }

  project_uuid = coolify_project.tet.uuid
  name         = each.value

  lifecycle {
    prevent_destroy = true
  }
}

# --- S3 storage (backups) ---
#
# coolify_s3_storage existe, mais garde access key et secret dans le state. On
# passe par l'API REST (GET/POST/PATCH /s3-storages + POST …/validate), credentials
# lus dans Secret Manager par le script (R4).
resource "terraform_data" "s3_storage" {
  triggers_replace = [
    var.s3_storage_name,
    var.s3_bucket,
    var.s3_endpoint,
    var.s3_region,
    var.s3_credentials_secret_name,
    var.s3_credentials_revision,
  ]

  provisioner "local-exec" {
    command = "${path.module}/../scripts/coolify-configure-s3-storage.sh"
    environment = {
      COOLIFY_ENDPOINT           = var.coolify_endpoint
      SECRET_PROJECT_ID          = var.project_id
      S3_STORAGE_NAME            = var.s3_storage_name
      S3_ENDPOINT                = var.s3_endpoint
      S3_BUCKET                  = var.s3_bucket
      S3_REGION                  = var.s3_region
      S3_CREDENTIALS_SECRET_NAME = var.s3_credentials_secret_name
      S3_DESCRIPTION             = "Scaleway Object Storage (${var.s3_bucket}). Géré par Terraform (infra/coolify)."
      # COOLIFY_TOKEN hérité de l'environnement (coolify-env.sh).
    }
  }
}
