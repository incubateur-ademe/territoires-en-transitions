# Couche « Coolify-as-code » : ce qui vit *dans* Coolify, pas chez Scaleway.
#
# State distinct des stacks d'infrastructure : cette couche suppose Coolify
# déjà up et joignable. La garder séparée évite que le `plan` de l'infra
# Scaleway exige que l'application tourne (poule-œuf au premier boot).

locals {
  # Projet où lire la clé SSH de chaque serveur : la prod a le sien.
  server_key_project_ids = {
    for k, v in var.app_servers : k => coalesce(v.ssh_key_project_id, var.project_id)
  }

  # Serveur du control plane : Coolify le crée lui-même à l'install pour
  # piloter sa propre machine. On ne fait que lui substituer une clé stable.
  host_key_name = "${var.coolify_server_name}-host"
}

# --- Clé du serveur localhost (control plane) ---
#
# Clé privée SSH host, lue depuis Secret Manager (créée par infra/platform,
# module coolify → tls_private_key + scaleway_secret).
# `data` est renvoyé en base64 par le provider → on décode pour obtenir la clé
# OpenSSH telle quelle.
data "scaleway_secret_version" "host_key" {
  secret_name = var.host_key_secret_name
  project_id  = var.project_id
  revision    = "latest"
}

resource "coolify_private_key" "host" {
  name        = local.host_key_name
  description = "Clé host pilotant le serveur localhost du control plane. Gérée par Terraform (infra/coolify). Privée dans Secret Manager (${var.host_key_secret_name})."
  private_key = base64decode(data.scaleway_secret_version.host_key.data)
}

# Le serveur localhost reste hors de coolify_server : Coolify l'a créé à
# l'install (ip host.docker.internal) et c'est lui qui porte le control plane.
# On ne fait que lui substituer la clé, par l'API.
resource "terraform_data" "assign_host_key" {
  # Re-exécute si la clé change (rotation / recréation).
  triggers_replace = [coolify_private_key.host.uuid]

  provisioner "local-exec" {
    command = "${path.module}/../scripts/coolify-upsert-server.sh"
    environment = {
      COOLIFY_ENDPOINT = var.coolify_endpoint
      PRIVATE_KEY_UUID = coolify_private_key.host.uuid
      SERVER_NAME      = "localhost"
      MATCH_LOCALHOST  = "true"
      # COOLIFY_TOKEN est hérité de l'environnement (coolify-env.sh).
    }
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

# nonprod et preview : Coolify les joint sur leur IP privée, seule l'ACL du VPC
# laisse passer le control plane. prod : VPC séparé, Coolify la joint sur son
# IP publique, ouverte à la seule IP du control plane.
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
  description      = "Tier ${each.key}. Géré par Terraform (infra/${each.key}). [tet-server:${each.key}]"
  ip               = each.value.ssh_host
  user             = "root"
  port             = 22
  private_key_uuid = coolify_private_key.server[each.key].uuid
  is_build_server  = false

  lifecycle {
    prevent_destroy = true
  }
}

# Ancienne inscription par script : sortie du state sans rien détruire, son
# provisioner de destruction appelait l'API de suppression du serveur.
removed {
  from = terraform_data.server_registration

  lifecycle {
    destroy = false
  }
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
    var.coolify_public_ip,
    var.coolify_sshd_host_public_key,
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
      # Rebond obligatoire par le control plane : nonprod et preview n'ont pas
      # de SSH public, et celui de la prod n'accepte que l'IP de Coolify.
      BASTION_HOST     = var.coolify_public_ip
      BASTION_HOST_KEY = var.coolify_sshd_host_public_key
      BASTION_USER     = var.bastion_user
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

# Anciens projets, un par environnement (tet-preprod, tet-staging, tet-prod,
# tet-preview) : sortis du state sans être détruits. Leurs ressources sont
# déplacées à la main dans tet (UI : ressource → Settings → Move), puis les
# projets vides supprimés dans l'UI.
removed {
  from = coolify_project.env

  lifecycle {
    destroy = false
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

  # Après la clé host : Coolify est joignable et le token API a déjà été
  # exercé. Pas de dépendance sur les serveurs (chemins indépendants).
  depends_on = [terraform_data.assign_host_key]

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

# --- Sauvegarde de l'instance Coolify ---
#
# Les backups configurés dans Coolify couvrent les bases des applications, pas
# Coolify lui-même. Or sa base porte toute la configuration des quatre
# environnements (applications, variables, secrets) : sans elle, reconstruire
# le control plane revient à tout ressaisir.
#
# Timer systemd sur le control plane : pg_dump de coolify-db + .env (APP_KEY),
# chiffrés avec age vers les clés publiques des opérateurs, puis envoyés sur le
# bucket de backups sous instance_backup_prefix. Rétention : règle de cycle de
# vie du bucket (infra/platform). Restauration : infra/README.md.
resource "terraform_data" "instance_backup" {
  triggers_replace = [
    filesha256("${path.module}/../scripts/coolify-instance-backup.sh"),
    filesha256("${path.module}/../scripts/coolify-install-instance-backup.sh"),
    var.coolify_public_ip,
    var.coolify_sshd_host_public_key,
    var.instance_backup_age_recipients,
    var.instance_backup_on_calendar,
    var.instance_backup_prefix,
    var.s3_bucket,
    var.s3_endpoint,
    var.s3_region,
    var.s3_credentials_secret_name,
    var.s3_credentials_revision,
  ]

  provisioner "local-exec" {
    command = "${path.module}/../scripts/coolify-install-instance-backup.sh"
    environment = {
      TARGET_HOST                = var.coolify_public_ip
      TARGET_HOST_KEY            = var.coolify_sshd_host_public_key
      HOST_KEY_SECRET_NAME       = var.host_key_secret_name
      SECRET_PROJECT_ID          = var.project_id
      S3_ENDPOINT                = var.s3_endpoint
      S3_BUCKET                  = var.s3_bucket
      S3_REGION                  = var.s3_region
      S3_PREFIX                  = var.instance_backup_prefix
      S3_CREDENTIALS_SECRET_NAME = var.s3_credentials_secret_name
      AGE_RECIPIENTS             = join("\n", var.instance_backup_age_recipients)
      BACKUP_ON_CALENDAR         = var.instance_backup_on_calendar
    }
  }
}
