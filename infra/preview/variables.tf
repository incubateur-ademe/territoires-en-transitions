variable "project_id" {
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

variable "private_network_id" {
  description = "ID du Private Network preview. Valeur de : terraform -chdir=../platform output -json private_network_ids | jq -r .preview"
  type        = string
}

variable "server_private_ipv4_address" {
  description = "IP privée fixe du serveur preview. Doit correspondre à network_plan[\"preview\"].server_ipv4_address dans infra/platform, sinon l'ACL du VPC bloque le SSH de Coolify."
  type        = string
  default     = "10.0.4.10"
}

# --- Serveur applicatif ---

variable "server_instance_type" {
  description = "Type d'instance du serveur preview. Dimensionné pour ~5 previews simultanées, chacune portant app, backend, Postgres et Redis."
  type        = string
  default     = "PRO2-XS"
}

variable "server_root_volume_size_in_gb" {
  description = "Taille du volume racine du serveur preview, en GB. Plus large que les autres tiers : le churn d'images y est le plus fort."
  type        = number
  default     = 150
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

variable "docker_gc_until" {
  description = "Âge minimum, compté depuis leur création, des objets Docker inutilisés supprimés par le GC quotidien (filtre 'until' de docker system prune). Un conteneur arrêté récemment mais créé avant ce délai est supprimé ; les volumes sont conservés."
  type        = string
  default     = "72h"
}
