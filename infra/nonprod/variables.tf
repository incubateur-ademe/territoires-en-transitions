variable "main_project_id" {
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

variable "server_ssh_authorized_keys" {
  description = "Clés publiques SSH des opérateurs sur l'utilisateur tet-ops. L'accès se fait via le bastion Coolify (ssh -J), le port 22 n'étant pas exposé publiquement."
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
  description = "Taille du volume Postgres en GB. À ajuster en fonction de la taille réelle de la base."
  type        = number
  default     = 10
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

variable "redis_allowed_ips" {
  description = "CIDR autorisés à joindre le Redis preprod via l'endpoint public. Laisser vide (recommandé) : les conteneurs passent par le réseau privé."
  type        = map(string)
  default     = {}
}

# --- DNS ---

variable "dns_enabled" {
  description = "Crée les enregistrements DNS. Laisser à false tant que les zones n'ont pas été créées par infra/platform et déléguées chez le registrar."
  type        = bool
  default     = false
}

variable "dns_zones" {
  description = "Zones DNS servies par ce serveur. Les deux environnements du tier nonprod partagent la même IP publique."
  type        = list(string)
  default = [
    "preprod.territoiresentransitions.fr",
    "staging.territoiresentransitions.fr",
  ]
}

variable "dns_ttl" {
  description = "TTL des enregistrements DNS, en secondes. Court sur les environnements non-prod, où l'IP peut changer lors d'une recréation de serveur."
  type        = number
  default     = 300
}
