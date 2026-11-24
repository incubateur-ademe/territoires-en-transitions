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

# --- Accès à l'API Coolify (Team « TeT - Data ») ---

variable "coolify_endpoint" {
  description = "URL de base de l'API de l'instance Coolify de l'incubateur, suffixe /api/v1 inclus. Même valeur que dans infra/coolify."
  type        = string
  validation {
    condition     = startswith(var.coolify_endpoint, "https://") && endswith(var.coolify_endpoint, "/api/v1")
    error_message = "coolify_endpoint doit être de la forme https://<instance>/api/v1."
  }
}

# Pas « coolify_token » : coolify-env.sh exporte sous ce nom le token de notre
# Team, qui enregistrerait le serveur à côté de la prod.
variable "coolify_data_token" {
  description = "Token API Coolify (format {id}|{token}, scope root) de la Team « TeT - Data ». Fourni via TF_VAR_coolify_data_token par scripts/coolify-env.sh, jamais en clair dans le repo."
  type        = string
  sensitive   = true
}

# --- Réseau ---
#
# Le Private Network et l'IP de la passerelle VPN, créés par infra/platform,
# sont lus par data source (platform.tf).

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

variable "ssh_allowed_ips" {
  description = "CIDR autorisés sur le port 22 public du serveur, en plus de la passerelle VPN des opérateurs (ajoutée d'office, cf. platform.tf) : en pratique l'IP de sortie de l'instance Coolify de l'incubateur. Si elle change, réappliquer ce stack, sinon Coolify perd l'accès."
  type        = list(string)
  validation {
    condition = length(var.ssh_allowed_ips) > 0 && alltrue([
      for c in var.ssh_allowed_ips : can(cidrhost(c, 0)) && !startswith(c, "0.0.0.0/")
    ])
    error_message = "ssh_allowed_ips : au moins un CIDR (ex. 203.0.113.20/32), jamais 0.0.0.0/0."
  }
}

variable "server_ssh_authorized_keys" {
  description = "Clés publiques SSH des opérateurs sur l'utilisateur tet-ops. L'accès se fait par le VPN des opérateurs. Versionnée dans terraform.tfvars : une valeur locale écraserait celles des autres opérateurs."
  type        = list(string)
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

variable "vpn_public_ip" {
  description = "Secours : IP publique de la passerelle VPN, à passer (-var) quand la passerelle n'existe plus et que ssh_allowed_ips doit changer quand même. Null (défaut) : lue sur l'infra (platform.tf)."
  type        = string
  default     = null
  validation {
    condition     = var.vpn_public_ip == null || can(regex("^\\d+\\.\\d+\\.\\d+\\.\\d+$", var.vpn_public_ip))
    error_message = "vpn_public_ip : une adresse IPv4, sans masque."
  }
}
