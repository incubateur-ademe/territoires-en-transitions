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
