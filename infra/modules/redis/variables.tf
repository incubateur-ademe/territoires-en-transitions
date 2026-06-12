variable "environment" {
  description = "Nom de l'environnement (preprod, staging, prod). Utilisé pour le nommage des ressources."
  type        = string
  validation {
    condition     = contains(["preprod", "staging", "prod"], var.environment)
    error_message = "environment doit être l'une des valeurs : preprod, staging, prod."
  }
}

variable "zone" {
  description = "Zone Scaleway où provisionner le cluster Redis. Les clusters Redis sont zonés (pas régionaux)."
  type        = string
  default     = "fr-par-1"
}

variable "node_type" {
  description = "Type de nœud Redis Scaleway. RED1-MICRO (400 MB) suffit pour preprod. RED1-XS (1 GB) pour staging/prod selon charge queue."
  type        = string
  default     = "RED1-MICRO"
}

variable "redis_version" {
  description = "Version Redis à provisionner. Vérifier les versions disponibles sur Scaleway avant toute mise à jour."
  type        = string
  default     = "8.6.3"
}

variable "cluster_size" {
  description = "Nombre de nœuds. 1 pour standalone (preprod/staging), 3 minimum pour cluster HA (prod)."
  type        = number
  default     = 1
}

variable "admin_user_name" {
  description = "Nom de l'utilisateur Redis créé à la provision."
  type        = string
  default     = "tet_admin"
}

variable "private_network_id" {
  description = "ID du Private Network Scaleway à attacher au cluster Redis. À passer depuis module.vpc.private_network_id."
  type        = string
  default     = null
}

variable "allowed_ips" {
  description = "Plages IP (CIDR) autorisées à accéder au cluster Redis via l'endpoint public. Si vide (défaut), le cluster est accessible uniquement via le réseau privé — recommandé en production."
  type        = map(string)
  default     = {}
}

variable "tags" {
  description = "Tags additionnels appliqués au cluster Redis."
  type        = list(string)
  default     = []
}
