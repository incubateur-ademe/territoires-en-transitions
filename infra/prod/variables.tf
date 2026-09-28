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

# --- Réseau ---
#
# Valeurs produites par infra/platform. Référencées par valeur et non par
# terraform_remote_state : les stacks restent découplés, au prix d'un report
# manuel après le premier apply de platform.

variable "private_network_id" {
  description = "ID du Private Network prod. Valeur de : terraform -chdir=../platform output -json private_network_ids | jq -r .prod"
  type        = string
}

variable "server_private_ipv4_address" {
  description = "IP privée fixe du serveur prod. Doit correspondre à network_plan[\"prod\"].server_ipv4_address dans infra/platform, sinon l'ACL du VPC bloque le SSH de Coolify."
  type        = string
  default     = "10.0.3.10"
}

# --- Serveur applicatif ---

variable "server_instance_type" {
  description = "Type d'instance du serveur de production. Démarre petit : à monter après mesure de la charge réelle, une fois la bascule depuis Koyeb faite."
  type        = string
  default     = "PRO2-XS"
}

variable "server_root_volume_size_in_gb" {
  description = "Taille du volume racine du serveur de production, en GB."
  type        = number
  default     = 100
}

variable "server_ssh_authorized_keys" {
  description = "Clés publiques SSH des opérateurs sur l'utilisateur tet-ops. L'accès se fait via le bastion Coolify (ssh -J), le port 22 n'étant pas exposé publiquement."
  type        = list(string)
  default     = []
}

# --- Postgres managé (prod) ---

variable "pg_node_type" {
  description = "Type d'instance RDB de production. Démarre petit : à monter après mesure, avant la bascule du trafic réel."
  type        = string
  default     = "DB-DEV-S"
}

variable "pg_is_ha_cluster" {
  description = "Active la haute disponibilité (réplica synchrone). À passer à true avant la mise en service réelle de la production."
  type        = bool
  default     = false
}

variable "pg_volume_size_in_gb" {
  description = "Taille du volume Postgres en GB. À aligner sur la taille réelle de la base plus une marge de croissance."
  type        = number
  default     = 10
}

variable "pg_backup_schedule_frequency" {
  description = "Fréquence des backups automatiques, en heures."
  type        = number
  default     = 24
}

variable "pg_backup_schedule_retention" {
  description = "Rétention des backups automatiques, en jours. Plus longue qu'en non-prod."
  type        = number
  default     = 30
}

variable "pg_allowed_ips" {
  description = "CIDR autorisés à joindre le Postgres de production via l'endpoint public. Vide (défaut) : pas d'endpoint public, les conteneurs passent par le réseau privé. À renseigner le temps de la migration, puis à revider."
  type        = map(string)
  default     = {}
}

# --- Redis managé (prod) ---

variable "redis_node_type" {
  description = "Type de nœud Redis Scaleway pour la production."
  type        = string
  default     = "RED1-MICRO"
}

variable "redis_cluster_size" {
  description = "Nombre de nœuds Redis. 1 pour un standalone, 3 minimum pour un cluster HA."
  type        = number
  default     = 1
}

variable "redis_allowed_ips" {
  description = "CIDR autorisés à joindre le Redis de production via l'endpoint public. Laisser vide : les conteneurs passent par le réseau privé."
  type        = map(string)
  default     = {}
}

# --- DNS ---

variable "dns_enabled" {
  description = "Crée les enregistrements DNS de production. Reste à false : l'apex et les noms de production sont gérés par le registrar actuel."
  type        = bool
  default     = false
}

variable "dns_zones" {
  description = "Zones DNS servies par le serveur de production. Vide par défaut, la prod n'étant pas déléguée à Scaleway."
  type        = list(string)
  default     = []
}

variable "dns_ttl" {
  description = "TTL des enregistrements DNS, en secondes."
  type        = number
  default     = 300
}
