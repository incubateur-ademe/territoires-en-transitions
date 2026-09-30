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
  description = "URL de base de l'API Coolify (suffixe /api/v1 inclus). Valeur de : terraform -chdir=../platform output -raw coolify_endpoint"
  type        = string
  default     = "https://coolify.territoiresentransitions.fr/api/v1"
}

variable "coolify_token" {
  description = "Token API Coolify (format {id}|{token}, scope root). Fourni via TF_VAR_coolify_token par scripts/coolify-env.sh, jamais en clair dans le repo."
  type        = string
  sensitive   = true
}

# --- Control plane ---

variable "coolify_server_name" {
  description = "Nom de la VM du control plane. Sert à nommer la clé host dans Coolify."
  type        = string
  default     = "tet-platform-coolify"
}

variable "host_key_secret_name" {
  description = "Nom du secret Secret Manager contenant la clé privée SSH host du control plane (créé par infra/platform)."
  type        = string
  default     = "tet-platform-coolify-host-ssh-key"
}

variable "coolify_public_ip" {
  description = "IP publique du control plane. Sert d'hôte de rebond SSH vers les serveurs applicatifs, dont le port 22 n'est pas exposé. Valeur de : terraform -chdir=../platform output -raw coolify_public_ip"
  type        = string
}

variable "bastion_user" {
  description = "Utilisateur du rebond SSH sur le control plane. L'authentification vers le rebond utilise l'identité par défaut de l'opérateur (agent SSH)."
  type        = string
  default     = "tet-ops"
}

# --- Serveurs applicatifs ---

variable "app_servers" {
  description = <<-EOT
    Serveurs applicatifs à enregistrer dans Coolify, indexés par tier.

    Chaque valeur provient des outputs du stack du tier correspondant :
      name                = server_name
      ssh_host            = server_private_ip (nonprod, preview)
                            server_ssh_host   (prod : IP publique, VPC séparé)
      ssh_key_secret_name = server_ssh_key_secret_name
      ssh_key_project_id  = projet du secret, si ce n'est pas project_id
                            (prod : terraform -chdir=../platform output -raw prod_project_id)

    Le lien entre stacks se fait par valeurs et noms de secrets, jamais par
    terraform_remote_state : les stacks restent découplés.
  EOT
  type = map(object({
    name                = string
    ssh_host            = string
    ssh_key_secret_name = string
    ssh_key_project_id  = optional(string)
  }))
  default = {}
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

# --- Projets ---

variable "projects" {
  description = "Projets Coolify à créer, sous forme nom => description. Un par environnement applicatif."
  type        = map(string)
  default = {
    "tet-prod"    = "Production. Serveur dédié tet-prod-apps, Postgres et Redis managés."
    "tet-preprod" = "Préproduction : gate iso-prod. Serveur tet-nonprod-apps, Postgres et Redis managés."
    "tet-staging" = "Intégration continue de main. Serveur tet-nonprod-apps, Postgres et Redis conteneurisés."
    "tet-preview" = "Previews éphémères par pull request. Serveur tet-preview-apps, tout conteneurisé."
  }
}

# --- S3 storage Coolify (Scaleway Object Storage) ---

variable "s3_storage_name" {
  description = "Nom du S3 storage dans Coolify (clé d'idempotence du script API)."
  type        = string
  default     = "tet-scaleway-s3"
}

variable "s3_bucket" {
  description = "Nom du bucket Scaleway Object Storage. Valeur de : terraform -chdir=../platform output -raw coolify_backups_bucket_name"
  type        = string
  default     = "tet-coolify-backups"
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
  description = "Nom du secret SM contenant les credentials Object Storage au format <access_key>|<secret_key>. Créé par infra/platform (output coolify_backups_credentials_secret_name)."
  type        = string
  default     = "tet-platform-coolify-s3-credentials"
}

variable "s3_credentials_revision" {
  description = "Compteur opaque à incrémenter après rotation des clés Object Storage (nouvelle clé dans infra/platform) pour les repousser dans Coolify et sur le control plane (les clés ne sont pas dans le state de ce stack)."
  type        = string
  default     = "1"
}

# --- Sauvegarde de l'instance Coolify ---

variable "instance_backup_age_recipients" {
  description = "Clés publiques age (age1…) vers lesquelles chiffrer les backups de l'instance Coolify. Une par opérateur habilité à restaurer ; les clés privées restent hors du serveur et hors du repo (cf. README)."
  type        = list(string)
  validation {
    condition     = length(var.instance_backup_age_recipients) > 0 && alltrue([for r in var.instance_backup_age_recipients : can(regex("^age1[0-9a-z]{58}$", r))])
    error_message = "Au moins une clé publique age valide (age1 suivi de 58 caractères) est requise."
  }
}

variable "instance_backup_on_calendar" {
  description = "Planification du backup de l'instance, au format OnCalendar systemd (heure du serveur, UTC)."
  type        = string
  default     = "*-*-* 03:15:00"
}

variable "instance_backup_prefix" {
  description = "Préfixe des objets de backup de l'instance dans le bucket. Doit rester aligné sur coolify_instance_backup_prefix (infra/platform), qui porte la règle de rétention."
  type        = string
  default     = "coolify-instance"
}
