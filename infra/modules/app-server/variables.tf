variable "tier" {
  description = "Tier d'hébergement du serveur. Distinct de « environnement » : le tier nonprod porte à la fois preprod et staging."
  type        = string
  validation {
    condition     = contains(["prod", "nonprod", "preview"], var.tier)
    error_message = "tier doit être l'une des valeurs : prod, nonprod, preview."
  }
}

variable "name" {
  description = "Nom du serveur. Si null, vaut tet-<tier>-apps."
  type        = string
  default     = null
}

variable "zone" {
  description = "Zone Scaleway où provisionner le serveur."
  type        = string
  default     = "fr-par-1"
}

variable "instance_type" {
  description = "Type d'instance Scaleway. Vérifier la disponibilité dans la zone avec : scw instance server-type list zone=<zone>."
  type        = string
  default     = "PRO2-XS"
}

variable "root_volume_size_in_gb" {
  description = "Taille du volume racine en GB. Doit absorber les images Docker et les volumes des ressources Coolify. Prévoir large sur le tier preview (fort churn d'images)."
  type        = number
  default     = 100
}

variable "private_network_id" {
  description = "ID du Private Network auquel attacher le serveur. À passer depuis module.network.private_network_ids[<tier>]."
  type        = string
}

variable "private_ipv4_address" {
  description = "IP privée fixe à réserver dans le Private Network (sans masque). C'est l'adresse SSH que Coolify enregistre pour ce serveur — elle ne doit plus changer ensuite."
  type        = string
}

variable "ssh_allowed_ips" {
  description = "CIDR autorisés à joindre le port 22 sur l'IP publique. Laisser vide (défaut) : l'accès passe par le bastion Coolify en IP privée."
  type        = list(string)
  default     = []
}

variable "ssh_authorized_keys" {
  description = "Clés publiques SSH autorisées sur l'utilisateur tet-ops. Utile pour un accès opérateur via le bastion ; l'accès root est réservé à Coolify."
  type        = list(string)
  default     = []
}

variable "docker_gc_enabled" {
  description = "Installe un cron quotidien de docker system prune. À activer sur le tier preview, où le churn d'images sature le disque."
  type        = bool
  default     = false
}

variable "docker_gc_until" {
  description = "Âge minimum des objets Docker supprimés par le GC (filtre 'until' de docker system prune). Doit rester supérieur à la durée de vie attendue d'une preview inactive."
  type        = string
  default     = "72h"
}

variable "tags" {
  description = "Tags additionnels appliqués aux ressources du serveur."
  type        = list(string)
  default     = []
}

variable "deletion_protection" {
  description = "Protège le serveur contre la suppression (attribut protected Scaleway) et conserve son disque racine s'il est détruit. À false uniquement pour un serveur sans donnée à préserver (preview)."
  type        = bool
  default     = true
}
