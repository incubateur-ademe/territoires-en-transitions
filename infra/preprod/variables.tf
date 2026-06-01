variable "scaleway_project_id" {
  description = "UUID du projet Scaleway. À récupérer dans la console Scaleway (Project Settings)."
  type        = string
}

variable "scaleway_region" {
  description = "Région Scaleway par défaut."
  type        = string
  default     = "fr-par"
}

variable "scaleway_zone" {
  description = "Zone Scaleway par défaut (pour les ressources zonées)."
  type        = string
  default     = "fr-par-1"
}

variable "pg_node_type" {
  description = "Type d'instance RDB pour preprod. DB-DEV-S = 1 vCPU / 2 GB RAM, suffisant pour preprod."
  type        = string
  default     = "DB-DEV-S"
}

variable "pg_volume_size_in_gb" {
  description = "Taille du volume Postgres en GB. À ajuster en fonction de la taille actuelle de la DB Supabase preprod."
  type        = number
  default     = 10
}

variable "pg_allowed_ips" {
  description = "Plages IP autorisées (CIDR) à se connecter au Postgres preprod. Pendant la phase initiale d'exploration, peut inclure l'IP du dev qui pilote. À durcir avant tout démarrage de migration réelle."
  type        = map(string)
  default     = {}
}
