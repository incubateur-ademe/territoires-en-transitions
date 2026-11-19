variable "project_id" {
  description = "UUID du projet Scaleway de production, distinct du projet principal. Valeur de : terraform -chdir=../platform output -raw prod_project_id"
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
# VPC propre à la prod, créé par ce stack. Seul lien avec infra/platform :
# l'IP publique du control plane, reportée par valeur (pas de
# terraform_remote_state, les stacks restent découplés).

variable "private_network_ipv4_subnet" {
  description = "CIDR du Private Network prod, dans le VPC prod."
  type        = string
  default     = "10.0.3.0/24"
}

variable "server_private_ipv4_address" {
  description = "IP privée fixe du serveur prod dans son Private Network. Doit appartenir à private_network_ipv4_subnet."
  type        = string
  default     = "10.0.3.10"
}

variable "ssh_allowed_ips" {
  description = "CIDR autorisés sur le port 22 public du serveur : IP de sortie de l'instance Coolify de l'incubateur, et IP publique de la passerelle VPN des opérateurs (terraform -chdir=../platform output -raw vpn_public_ip). Si l'une change, réappliquer ce stack, sinon Coolify ou les opérateurs perdent l'accès."
  type        = list(string)
  validation {
    condition = length(var.ssh_allowed_ips) > 0 && alltrue([
      for c in var.ssh_allowed_ips : can(cidrhost(c, 0)) && !startswith(c, "0.0.0.0/")
    ])
    error_message = "ssh_allowed_ips : au moins un CIDR (ex. 203.0.113.20/32), jamais 0.0.0.0/0."
  }
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
  description = "Clés publiques SSH des opérateurs sur l'utilisateur tet-ops. L'accès se fait par le VPN des opérateurs."
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
  description = "Taille du volume Postgres en GB. La base restaurée pèse ~9,4 GB (8 GB de données, 1,5 GB d'index) : 10 GB saturent pendant une restauration (volume en disk_full, instance en lecture seule). Le volume s'agrandit à chaud mais ne se réduit pas : réduire impose de recréer l'instance."
  type        = number
  default     = 20
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

# --- Observabilité ---

variable "scaleway_secret_key" {
  description = "Clé secrète IAM de l'opérateur, pour le provider grafana. Exportée par scripts/tf-env.sh (TF_VAR_scaleway_secret_key)."
  type        = string
  sensitive   = true
}

variable "alert_emails" {
  description = "Destinataires des alertes du Cockpit prod (alertes préconfigurées et règles de infra/observability/rules)."
  type        = list(string)
  validation {
    condition     = length(var.alert_emails) > 0
    error_message = "Au moins un destinataire : sans contact, les alertes ne partent nulle part."
  }
}
