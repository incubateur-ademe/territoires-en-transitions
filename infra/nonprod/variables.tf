variable "project_id" {
  description = "UUID du projet Scaleway. À récupérer dans la console Scaleway (Project Settings)."
  type        = string
}

variable "scaleway_region" {
  description = "Région Scaleway par défaut."
  type        = string
  default     = "fr-par"
}

variable "scaleway_secret_key" {
  description = "Clé secrète IAM de l'opérateur, pour le provider grafana. Exportée par scripts/tf-env.sh (TF_VAR_scaleway_secret_key)."
  type        = string
  sensitive   = true
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
  description = "ID du Private Network nonprod. Valeur de : terraform -chdir=../platform output -json private_network_ids | jq -r .nonprod"
  type        = string
}

variable "server_private_ipv4_address" {
  description = "IP privée fixe du serveur nonprod. Doit correspondre à network_plan[\"nonprod\"].server_ipv4_address dans infra/platform, sinon l'ACL du VPC bloque le SSH de Coolify."
  type        = string
  default     = "10.0.1.10"
}

# --- Serveur applicatif ---

variable "server_instance_type" {
  description = "Type d'instance du serveur nonprod. Doit absorber deux stacks applicatives (preprod + staging) plus le Postgres et le Redis conteneurisés de staging."
  type        = string
  default     = "PRO2-XS"
}

variable "server_root_volume_size_in_gb" {
  description = "Taille du volume racine du serveur nonprod, en GB."
  type        = number
  default     = 100
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

variable "server_ssh_authorized_keys" {
  description = "Clés publiques SSH des opérateurs sur l'utilisateur tet-ops. L'accès se fait par le VPN des opérateurs."
  type        = list(string)
  default     = []
}

# --- Postgres managé (preprod) ---

variable "pg_node_type" {
  description = "Type d'instance RDB pour preprod. Démarrer petit et monter après mesure."
  type        = string
  default     = "DB-DEV-S"
}

variable "pg_volume_size_in_gb" {
  description = "Taille du volume Postgres en GB. Les seules données de la prod restaurée pèsent ~8 GB avant index : 10 GB saturent pendant la restauration (le volume passe en disk_full, l'instance en lecture seule). Le volume s'agrandit à chaud mais ne se réduit pas : réduire impose de recréer l'instance."
  type        = number
  default     = 20
}

variable "pg_allowed_ips" {
  description = "CIDR autorisés à joindre le Postgres preprod via l'endpoint public. Les conteneurs passent par le réseau privé : n'y lister que les accès opérateur et les runners de restore."
  type        = map(string)
  default     = {}
}

# --- Redis managé (preprod) ---

variable "redis_node_type" {
  description = "Type de nœud Redis Scaleway pour preprod."
  type        = string
  default     = "RED1-MICRO"
}

# --- Observabilité ---

variable "alert_emails" {
  description = "Destinataires des alertes Cockpit du projet principal (alertes préconfigurées et règles de infra/observability/rules)."
  type        = list(string)
  validation {
    condition     = length(var.alert_emails) > 0
    error_message = "Au moins un destinataire : sans contact, les alertes ne partent nulle part."
  }
}
