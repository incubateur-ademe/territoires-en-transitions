variable "environment" {
  description = "Nom de l'environnement (preprod, staging, prod)."
  type        = string
  validation {
    condition     = contains(["preprod", "staging", "prod"], var.environment)
    error_message = "environment doit être l'une des valeurs : preprod, staging, prod."
  }
}

variable "zone" {
  description = "Zone Scaleway où provisionner la VM Coolify."
  type        = string
  default     = "fr-par-1"
}

variable "instance_type" {
  description = "Type d'instance Scaleway pour la VM Coolify. DEV1-L (4 vCPU / 8 GB) suffit pour preprod avec 9 conteneurs. PRO2-S recommandé en prod."
  type        = string
  default     = "DEV1-L"
}

variable "root_volume_size_in_gb" {
  description = "Taille du volume racine en GB. 50 GB est un minimum raisonnable pour les images Docker et les volumes Coolify."
  type        = number
  default     = 50
}

variable "private_network_id" {
  description = "ID du Private Network Scaleway auquel attacher la VM. La VM communique avec le Postgres RDB via ce réseau privé."
  type        = string
}

variable "ssh_allowed_ips" {
  description = "Liste de CIDR autorisés à se connecter en SSH. Ne jamais laisser 0.0.0.0/0 en prod. En preprod, inclure uniquement les IPs des opérateurs qui pilotent la migration."
  type        = list(string)
}

variable "ssh_authorized_keys" {
  description = "Clés publiques SSH (format 'ssh-ed25519 AAAA...') autorisées sur l'utilisateur tet-ops. Si vide, seules les clés du projet Scaleway (injectées automatiquement par Scaleway) seront disponibles."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags additionnels appliqués aux ressources Coolify."
  type        = list(string)
  default     = []
}
