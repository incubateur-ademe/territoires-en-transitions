variable "environment" {
  description = "Nom de l'environnement (preprod, prod, preview, stats). Utilisé pour le nommage des ressources."
  type        = string
  validation {
    condition     = contains(["preprod", "prod", "preview", "stats"], var.environment)
    error_message = "environment doit être l'une des valeurs : preprod, prod, preview, stats."
  }
}

variable "region" {
  description = "Région Scaleway où provisionner l'instance RDB."
  type        = string
  default     = "fr-par"
}

variable "node_type" {
  description = "Type d'instance Scaleway RDB. Cf. https://www.scaleway.com/en/database-postgresql-and-mysql/ pour la liste complète. Exemples : DB-DEV-S, DB-DEV-M, DB-PRO2-XXS, DB-PRO2-S."
  type        = string
}

variable "engine" {
  description = "Version du moteur Postgres. Un dump Supabase Cloud (PostgreSQL-15) se restaure sur une version supérieure."
  type        = string
  default     = "PostgreSQL-17"
}

variable "is_ha_cluster" {
  description = "Active la haute disponibilité (réplica synchrone). Doit être true en production, peut être false en preprod pour limiter le coût."
  type        = bool
  default     = false
}

variable "volume_type" {
  description = "Type de volume associé à l'instance (sbs_5k, sbs_15k)."
  type        = string
  default     = "sbs_5k"
}

variable "volume_size_in_gb" {
  description = "Taille du volume en gigaoctets. À aligner sur la taille actuelle de la DB Supabase + marge de croissance."
  type        = number
  default     = 10
}

variable "backup_schedule_frequency" {
  description = "Fréquence des backups automatiques en heures (24 = quotidien)."
  type        = number
  default     = 24
}

variable "backup_schedule_retention" {
  description = "Durée de rétention des backups en jours."
  type        = number
  default     = 7
}

variable "backup_same_region" {
  description = "Conserver les backups dans la même région. Mettre à false pour rétention cross-région (résilience supérieure, coût plus élevé)."
  type        = bool
  default     = true
}

variable "admin_user_name" {
  description = "Nom de l'utilisateur admin initial créé sur l'instance RDB."
  type        = string
  default     = "tet_admin"
}

variable "database_name" {
  description = "Nom de la base de données applicative principale."
  type        = string
  default     = "tet"
}

variable "private_network_id" {
  description = "ID du Private Network Scaleway à attacher à l'instance RDB, endpoint par défaut de l'instance. À passer depuis module.network.private_network_ids[<tier>]."
  type        = string
}

variable "tags" {
  description = "Tags additionnels appliqués à l'instance RDB."
  type        = list(string)
  default     = []
}

variable "settings" {
  description = "GUC PostgreSQL à overrider au niveau de l'instance (équivalent postgresql.conf). Scaleway whitelist les paramètres autorisés — un terraform plan signale ceux qui ne le sont pas. Les valeurs sont des strings ; pour les durées, utiliser des entiers en millisecondes (ex: 600000 pour 10min)."
  type        = map(string)
  default     = {}
}

variable "public_allowed_cidrs" {
  description = "CIDR de l'ACL de l'endpoint public, par nom (ex. { prod = \"203.0.113.10/32\" }). Pour un consommateur hors du VPC, à qui aucun lien réseau n'est ouvert. N'ouvre pas l'endpoint (public_endpoint_enabled) et ne se vide qu'une fois l'endpoint supprimé."
  type        = map(string)
  default     = {}
  validation {
    condition = alltrue([
      for c in values(var.public_allowed_cidrs) : can(cidrhost(c, 0)) && !endswith(c, "/0")
    ])
    error_message = "public_allowed_cidrs : des CIDR valides (ex. 203.0.113.10/32), jamais /0."
  }
}

variable "public_endpoint_enabled" {
  description = "Ouvre l'endpoint public. À passer à true dans un second apply, une fois l'ACL de public_allowed_cidrs posée et vérifiée. Repasser à false ne supprime pas l'endpoint : scw rdb endpoint delete."
  type        = bool
  default     = false
  validation {
    condition     = !var.public_endpoint_enabled || length(var.public_allowed_cidrs) > 0
    error_message = "public_endpoint_enabled exige public_allowed_cidrs : sans ACL, l'endpoint serait ouvert à tous."
  }
}
