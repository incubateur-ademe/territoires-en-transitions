variable "scaleway_project_id" {
  description = "UUID du projet Scaleway preprod (le même que infra/preprod). Nécessaire pour lire le secret de la clé host dans Secret Manager."
  type        = string
}

variable "scaleway_region" {
  description = "Région Scaleway (où vit le secret de la clé host)."
  type        = string
  default     = "fr-par"
}

variable "scaleway_zone" {
  description = "Zone Scaleway par défaut."
  type        = string
  default     = "fr-par-1"
}

variable "coolify_endpoint" {
  description = "URL de base de l'API Coolify preprod (suffixe /api/v1 inclus)."
  type        = string
  default     = "https://coolify.preprod.territoiresentransitions.fr/api/v1"
}

variable "coolify_token" {
  description = "Token API Coolify (format {id}|{token}, scope root). Fourni via TF_VAR_coolify_token par scripts/coolify-env.sh, jamais en clair dans le repo."
  type        = string
  sensitive   = true
}

variable "host_key_secret_name" {
  description = "Nom du secret Scaleway Secret Manager contenant la clé privée SSH host (créé par infra/preprod, module coolify)."
  type        = string
  default     = "tet-preprod-coolify-host-ssh-key"
}

variable "coolify_public_ip" {
  description = "IP publique de la VM Coolify (terraform output -raw coolify_public_ip dans infra/preprod). Utilisée pour SSH root + docker login GHCR."
  type        = string
}

variable "ghcr_pull_secret_name" {
  description = "Nom du secret SM contenant les credentials GHCR au format <github-username>|<pat-read:packages>. Créé manuellement (bootstrap README)."
  type        = string
  default     = "tet-preprod-ghcr-pull"
}

variable "ghcr_pull_credentials_revision" {
  description = "Compteur opaque à incrémenter après rotation du PAT GHCR pour forcer un nouveau docker login (le PAT n'est pas dans le state)."
  type        = string
  default     = "1"
}

# --- S3 storage Coolify (Scaleway Object Storage) ---

variable "s3_storage_name" {
  description = "Nom du S3 storage dans Coolify (clé d'idempotence du script API)."
  type        = string
  default     = "tet-preprod-scaleway-s3"
}

variable "s3_bucket" {
  description = "Nom du bucket Scaleway Object Storage (output coolify_backups_bucket_name de infra/preprod)."
  type        = string
  default     = "tet-preprod-coolify-backups"
}

variable "s3_endpoint" {
  description = "Endpoint S3-compatible Scaleway (sans le nom du bucket)."
  type        = string
  default     = "https://s3.fr-par.scw.cloud"
}

variable "s3_region" {
  description = "Région Object Storage Scaleway."
  type        = string
  default     = "fr-par"
}

variable "s3_credentials_secret_name" {
  description = "Nom du secret SM contenant les credentials Object Storage au format <access_key>|<secret_key>. Créé manuellement (bootstrap README)."
  type        = string
  default     = "tet-preprod-coolify-s3-credentials"
}

variable "s3_credentials_revision" {
  description = "Compteur opaque à incrémenter après rotation des clés Object Storage pour rejouer create/update + validate (les clés ne sont pas dans le state)."
  type        = string
  default     = "1"
}
