variable "environment" {
  description = "Nom de l'environnement (preprod, staging, prod). Utilisé pour le nommage des ressources."
  type        = string
  validation {
    condition     = contains(["preprod", "staging", "prod"], var.environment)
    error_message = "environment doit être l'une des valeurs : preprod, staging, prod."
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
  description = "Version du moteur Postgres. La valeur doit être identique à celle utilisée par Supabase Cloud côté source (PostgreSQL-15)."
  type        = string
  default     = "PostgreSQL-15"
}

variable "is_ha_cluster" {
  description = "Active la haute disponibilité (réplica synchrone). Doit être true en production, peut être false en preprod pour limiter le coût."
  type        = bool
  default     = false
}

variable "volume_type" {
  description = "Type de volume associé à l'instance (bssd, lssd, sbs_5k, sbs_15k). bssd est un bon défaut polyvalent."
  type        = string
  default     = "bssd"
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

variable "allowed_ips" {
  description = "Liste des plages IP autorisées à se connecter à l'instance, en notation CIDR. Pendant la migration, inclure : (1) IP publique de la VM Coolify, (2) IP du runner CI qui pilote le restore, (3) IP des postes opérateurs autorisés."
  type        = map(string)
  default     = {}
}

variable "tags" {
  description = "Tags additionnels appliqués à l'instance RDB."
  type        = list(string)
  default     = []
}
