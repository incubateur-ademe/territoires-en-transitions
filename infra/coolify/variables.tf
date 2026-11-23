variable "project_id" {
  description = "UUID du projet Scaleway. Nécessaire pour lire les clés SSH dans Secret Manager."
  type        = string
}

variable "scaleway_region" {
  description = "Région Scaleway (où vivent les secrets)."
  type        = string
  default     = "fr-par"
}

variable "scaleway_zone" {
  description = "Zone Scaleway par défaut."
  type        = string
  default     = "fr-par-1"
}

# --- Accès à l'API Coolify ---

variable "coolify_endpoint" {
  description = "URL de base de l'API de l'instance Coolify de l'incubateur, suffixe /api/v1 inclus. Relue aussi par scripts/coolify-env.sh."
  type        = string
  validation {
    condition     = startswith(var.coolify_endpoint, "https://") && endswith(var.coolify_endpoint, "/api/v1")
    error_message = "coolify_endpoint doit être de la forme https://<instance>/api/v1."
  }
}

variable "coolify_token" {
  description = "Token API Coolify (format {id}|{token}, scope root, créé dans notre Team sur l'instance de l'incubateur). Fourni via TF_VAR_coolify_token par scripts/coolify-env.sh, jamais en clair dans le repo."
  type        = string
  sensitive   = true
}

# --- Serveurs applicatifs ---

variable "prod_project_id" {
  description = "UUID du projet Scaleway de production (tet-prod), où vivent le serveur prod et ses secrets."
  type        = string
}

# --- GHCR ---

variable "ghcr_pull_secret_name" {
  description = "Nom du secret SM contenant les credentials GHCR au format <github-username>|<pat-read:packages>. Créé manuellement (bootstrap README). Partagé par tous les serveurs."
  type        = string
  default     = "tet-platform-ghcr-pull"
}

variable "ghcr_pull_credentials_revision" {
  description = "Compteur opaque à incrémenter après rotation du PAT GHCR pour forcer un nouveau docker login (le PAT n'est pas dans le state)."
  type        = string
  default     = "1"
}

# --- Applications ---

variable "application_environments" {
  description = "Environnements dont les applications sont déclarées dans Coolify (cf. applications.tf). Ouverture progressive : preprod d'abord, prod à la bascule DNS."
  type        = set(string)
  default     = ["preprod"]
  validation {
    condition     = alltrue([for e in var.application_environments : contains(["preprod", "prod"], e)])
    error_message = "application_environments n'accepte que preprod et prod. Les previews sont créées par la CD, pas par Terraform."
  }
}

variable "application_initial_image_tag" {
  description = "Tag posé à la création d'une application, et jamais ensuite : la CD possède la version (scripts/coolify-deploy.sh). Aucun déploiement n'a lieu à la création."
  type        = string
  default     = "latest"
}

# --- Variables d'environnement ---

variable "coolify_env_revision" {
  description = "Compteur opaque à incrémenter après le dépôt d'une nouvelle version d'un secret dans Secret Manager : les valeurs ne sont pas dans le state, seul ce compteur force un nouveau push."
  type        = string
  default     = "1"
}

variable "coolify_env_prune" {
  description = "Supprime de Coolify les variables absentes du manifeste. Le manifeste fait autorité : une variable posée à la main dans l'UI est une dérive."
  type        = bool
  default     = true
}
