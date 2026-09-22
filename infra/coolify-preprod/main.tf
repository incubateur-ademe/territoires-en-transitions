# Clé privée SSH host, lue depuis Scaleway Secret Manager (créée par
# infra/preprod, module coolify → tls_private_key + scaleway_secret).
# `data` est renvoyé en base64 par le provider → on décode pour obtenir la clé
# OpenSSH telle quelle.
data "scaleway_secret_version" "host_key" {
  secret_name = var.host_key_secret_name
  revision    = "latest"
}

# Enregistre la clé host dans Coolify (équivalent Keys & Tokens > Add Private Key),
# de façon déclarative et idempotente. C'est le socle réutilisable : les projects
# et applications viendront s'ajouter dans cette même couche par la suite.
resource "coolify_private_key" "host" {
  name        = "tet-preprod-coolify-host"
  description = "Clé host pilotant le serveur localhost. Gérée par Terraform (infra/coolify-preprod). Privée dans Secret Manager (${var.host_key_secret_name})."
  private_key = base64decode(data.scaleway_secret_version.host_key.data)
}

# Assignation de la clé au serveur localhost + validation.
#
# Fait via l'API REST (endpoints vérifiés dans openapi.yaml : GET /servers puis
# PATCH /servers/{uuid} avec private_key_uuid + instant_validate) plutôt que via
# la ressource coolify_server du provider, marquée « not fully implemented ».
# Raison de fond : le serveur localhost héberge les projects en cours ; le faire
# gérer par une ressource incomplète risquerait un drift destructeur. On isole
# donc ce seul geste dans un script idempotent.
resource "terraform_data" "assign_host_key" {
  # Re-exécute si la clé change (rotation / recréation).
  triggers_replace = [coolify_private_key.host.uuid]

  provisioner "local-exec" {
    command = "${path.module}/../scripts/coolify-assign-host-key.sh"
    environment = {
      COOLIFY_ENDPOINT = var.coolify_endpoint
      HOST_KEY_UUID    = coolify_private_key.host.uuid
      # COOLIFY_TOKEN est hérité de l'environnement (coolify-env.sh).
    }
  }
}

# docker login ghcr.io sur root@VM — prérequis pour tirer les images privées
# (Coolify n'a pas d'API de credentials registry ; le helper monte
# /root/.docker/config.json). Le PAT reste hors state : lecture scw + SSH
# dans le script (R4). Rejouer après rotation : bump ghcr_pull_credentials_revision
# ou `terraform apply -replace=terraform_data.ghcr_docker_login`.
resource "terraform_data" "ghcr_docker_login" {
  triggers_replace = [
    var.coolify_public_ip,
    var.ghcr_pull_secret_name,
    var.ghcr_pull_credentials_revision,
    # Recréation de la clé host ⇒ rejouer le login (VM / secrets liés).
    coolify_private_key.host.uuid,
  ]

  # Après assignation localhost : la VM est joignable via la clé host.
  depends_on = [terraform_data.assign_host_key]

  provisioner "local-exec" {
    command = "${path.module}/../scripts/coolify-ghcr-docker-login.sh"
    environment = {
      COOLIFY_PUBLIC_IP     = var.coolify_public_ip
      HOST_KEY_SECRET_NAME  = var.host_key_secret_name
      GHCR_PULL_SECRET_NAME = var.ghcr_pull_secret_name
    }
  }
}

# S3 storage Scaleway dans Coolify (backups DB / volumes).
#
# Le provider sierrajc/coolify n'expose pas coolify_s3_storage (disponible
# seulement sur coolify-terraform/coolify). On passe par l'API REST vérifiée
# (GET/POST/PATCH /s3-storages + POST …/validate), comme pour l'assignation
# de la clé host. Credentials hors state : Secret Manager + script (R4).
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
  # exercé. Pas de dépendance stricte sur GHCR (chemins indépendants).
  depends_on = [terraform_data.assign_host_key]

  provisioner "local-exec" {
    command = "${path.module}/../scripts/coolify-configure-s3-storage.sh"
    environment = {
      COOLIFY_ENDPOINT           = var.coolify_endpoint
      S3_STORAGE_NAME            = var.s3_storage_name
      S3_ENDPOINT                = var.s3_endpoint
      S3_BUCKET                  = var.s3_bucket
      S3_REGION                  = var.s3_region
      S3_CREDENTIALS_SECRET_NAME = var.s3_credentials_secret_name
      S3_DESCRIPTION             = "Scaleway Object Storage (${var.s3_bucket}). Géré par Terraform (infra/coolify-preprod)."
      # COOLIFY_TOKEN hérité de l'environnement (coolify-env.sh).
    }
  }
}
