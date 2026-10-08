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

# Enregistrement des serveurs distants via l'API REST plutôt que via la
# ressource coolify_server du provider, marquée « not fully implemented » :
# un drift sur cette ressource détacherait les projets déployés.
#
# nonprod et preview : Coolify les joint sur leur IP privée, seule l'ACL du VPC
# laisse passer le control plane. prod : VPC séparé, Coolify la joint sur son
# IP publique, ouverte à la seule IP du control plane.
#
# Rejoué à chaque changement de nom, d'adresse ou de clé : le script retrouve
# le serveur par le marqueur [tet-server:<tier>] de sa description et le met à
# jour, sans jamais en créer un second.
resource "terraform_data" "server" {
  for_each = var.app_servers

  triggers_replace = [
    each.key,
    each.value.name,
    each.value.ssh_host,
    coolify_private_key.server[each.key].uuid,
  ]

  provisioner "local-exec" {
    command = "${path.module}/../scripts/coolify-upsert-server.sh"
    environment = {
      COOLIFY_ENDPOINT   = var.coolify_endpoint
      PRIVATE_KEY_UUID   = coolify_private_key.server[each.key].uuid
      SERVER_ID          = each.key
      SERVER_NAME        = each.value.name
      SERVER_IP          = each.value.ssh_host
      SERVER_USER        = "root"
      SERVER_PORT        = "22"
      SERVER_DESCRIPTION = "Tier ${each.key}. Géré par Terraform (infra/${each.key})."
      # COOLIFY_TOKEN est hérité de l'environnement (coolify-env.sh).
    }
  }
}

# Présence du serveur dans Coolify, liée au tier seul.
#
# Séparée de terraform_data.server : celui-ci est remplacé à chaque rotation de
# clé ou changement d'adresse, et un provisioner de destruction y retirerait le
# serveur de Coolify à chaque fois. Ici, seul le retrait du tier de app_servers
# détruit la ressource, et donc retire le serveur de Coolify.
#
# Coolify refuse de retirer un serveur qui héberge encore des ressources :
# l'apply échoue alors, volontairement. Rien n'est forcé.
#
# depends_on sur terraform_data.server, qui dépend de la clé : à la
# destruction, le serveur est retiré avant que Terraform ne supprime sa clé,
# que Coolify refuserait de supprimer tant qu'elle est utilisée.
resource "terraform_data" "server_registration" {
  for_each = var.app_servers

  triggers_replace = [each.key]

  # Un provisioner de destruction ne peut lire que self : tout ce dont le
  # script a besoin est figé ici. COOLIFY_TOKEN vient de l'environnement.
  input = {
    coolify_endpoint = var.coolify_endpoint
    server_id        = each.key
    server_name      = each.value.name
  }

  depends_on = [terraform_data.server]

  provisioner "local-exec" {
    when    = destroy
    command = "${path.module}/../scripts/coolify-delete-server.sh"
    environment = {
      COOLIFY_ENDPOINT = self.input.coolify_endpoint
      SERVER_ID        = self.input.server_id
      SERVER_NAME      = self.input.server_name
    }
  }
}

# docker login ghcr.io sur root@serveur — prérequis pour tirer les images
# privées (Coolify n'a pas d'API de credentials registry ; le helper monte
# /root/.docker/config.json).
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
  depends_on = [terraform_data.server]

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

# --- Projets ---
#
# Un projet par environnement. staging et preprod partagent un serveur mais
# restent deux projets distincts : c'est la frontière de configuration
# (variables, domaines, ressources) qui compte, pas la machine.
resource "coolify_project" "env" {
  for_each = var.projects

  name        = each.key
  description = each.value
}

# --- S3 storage (backups) ---
#
# Le provider sierrajc/coolify n'expose pas coolify_s3_storage (disponible
# seulement sur coolify-terraform/coolify). On passe par l'API REST vérifiée
# (GET/POST/PATCH /s3-storages + POST …/validate), comme pour les serveurs.
# Credentials hors state : Secret Manager + script (R4).
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
