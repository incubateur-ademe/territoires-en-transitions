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

variable "server_ssh_authorized_keys" {
  description = "Clés publiques SSH des opérateurs sur l'utilisateur tet-ops. L'accès se fait via le bastion Coolify (ssh -J)."
  type        = list(string)
  default     = []
}

variable "docker_gc_until" {
  description = "Âge minimum des objets Docker supprimés par le GC quotidien. Doit rester supérieur à la durée d'inactivité attendue d'une preview encore ouverte."
  type        = string
  default     = "72h"
}

# --- DNS ---

variable "dns_enabled" {
  description = "Crée les enregistrements DNS. Laisser à false tant que la zone n'a pas été créée par infra/platform et déléguée chez le registrar."
  type        = bool
  default     = false
}

variable "dns_zone" {
  description = "Zone DNS des previews. Chaque PR reçoit un sous-domaine sous cette zone."
  type        = string
  default     = "preview.territoiresentransitions.fr"
}

variable "dns_ttl" {
  description = "TTL des enregistrements DNS, en secondes."
  type        = number
  default     = 300
}
