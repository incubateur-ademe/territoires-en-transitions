variable "project_id" {
  description = "UUID du projet Scaleway principal. À récupérer dans la console Scaleway (Project Settings)."
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
# terraform_remote_state : les stacks restent découplés.

variable "private_network_id" {
  description = "ID du Private Network data. Valeur de : terraform -chdir=../platform output -json private_network_ids | jq -r .data"
  type        = string
}

variable "server_private_ipv4_address" {
  description = "IP privée fixe du serveur data. Doit correspondre à network_plan[\"data\"].server_ipv4_address dans infra/platform, sinon l'ACL du VPC bloque le SSH de Coolify."
  type        = string
  default     = "10.0.2.10"
}

# --- Serveur ---

variable "server_instance_type" {
  description = "Type d'instance du serveur data. arm64 : les images déployées doivent exister en linux/arm64. Vérifier la disponibilité : scw instance server-type list zone=<zone>."
  type        = string
  default     = "BASIC2-A2C-8G"
}

variable "server_root_volume_size_in_gb" {
  description = "Taille du volume racine du serveur data, en GB. Prévoir les imports open data et les volumes Metabase/Streamlit."
  type        = number
  default     = 100
}

variable "server_ssh_authorized_keys" {
  description = "Clés publiques SSH des opérateurs sur l'utilisateur tet-ops. L'accès se fait via le bastion Coolify (ssh -J), le port 22 n'étant pas exposé publiquement."
  type        = list(string)
  default     = []
}

# --- Postgres managé (stats) ---

variable "pg_node_type" {
  description = "Type d'instance RDB de la base de stats. Démarrer petit et monter après mesure."
  type        = string
  default     = "DB-DEV-S"
}

variable "pg_volume_size_in_gb" {
  description = "Taille du volume Postgres en GB. Le volume s'agrandit à chaud mais ne se réduit pas."
  type        = number
  default     = 30
}

variable "pg_allowed_ips" {
  description = "CIDR autorisés à joindre la base de stats via l'endpoint public. Les conteneurs passent par le réseau privé : n'y lister que les accès opérateur et la migration depuis Koyeb."
  type        = map(string)
  default     = {}
}
