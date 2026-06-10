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

variable "vpc_ipv4_subnet" {
  description = "CIDR IPv4 du Private Network preprod. Utiliser un /24 distinct par environnement : 10.0.1.0/24 pour preprod, 10.0.2.0/24 pour staging, 10.0.3.0/24 pour prod."
  type        = string
  default     = "10.0.1.0/24"
}

variable "coolify_instance_type" {
  description = "Type d'instance Scaleway pour la VM Coolify preprod. DEV1-L (4 vCPU / 8 GB) suffit pour 9 conteneurs en preprod. Ajuster après tests de charge."
  type        = string
  default     = "DEV1-L"
}

variable "coolify_ssh_allowed_ips" {
  description = "Liste de CIDR autorisés à se connecter en SSH à la VM Coolify preprod. En pratique : IPs des devs qui pilotent la migration + runners CI si besoin."
  type        = list(string)
  default     = []
}

variable "coolify_ssh_authorized_keys" {
  description = "Clés publiques SSH (format 'ssh-ed25519 AAAA...') injectées dans l'utilisateur tet-ops via cloud-init. Si vide, utiliser les clés du projet Scaleway."
  type        = list(string)
  default     = []
}

variable "pg_allowed_ips" {
  description = "Plages IP autorisées (CIDR) à se connecter au Postgres preprod. Pendant la phase initiale d'exploration, peut inclure l'IP du dev qui pilote. À durcir avant tout démarrage de migration réelle."
  type        = map(string)
  default     = {}
}
