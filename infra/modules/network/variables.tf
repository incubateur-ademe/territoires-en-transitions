variable "vpc_name" {
  description = "Nom du VPC partagé. Pas de suffixe d'environnement : un seul VPC porte tous les tiers."
  type        = string
  default     = "tet"
}

variable "region" {
  description = "Région Scaleway où provisionner le VPC et ses Private Networks."
  type        = string
  default     = "fr-par"
}

variable "private_networks" {
  description = "Private Networks à créer, indexés par nom de tier (platform, nonprod, prod, preview). Chaque tier doit avoir un /24 distinct."
  type = map(object({
    ipv4_subnet = string
  }))
}

variable "acl_enabled" {
  description = "Crée les ACL VPC (IPv4 et IPv6). Mettre à false uniquement pour déboguer un problème de routage privé — le trafic inter-PN devient alors entièrement ouvert."
  type        = bool
  default     = true
}

variable "acl_default_policy" {
  description = "Action appliquée aux paquets inter-PN ne correspondant à aucune règle. 'drop' est le défaut voulu : seuls les flux explicitement listés passent."
  type        = string
  default     = "drop"
  validation {
    condition     = contains(["accept", "drop"], var.acl_default_policy)
    error_message = "acl_default_policy doit être 'accept' ou 'drop'."
  }
}

variable "acl_rules" {
  description = "Règles ACL inter-Private Networks. Composées par le stack appelant (infra/platform) pour rester lisibles au même endroit que les CIDR."
  type = list(object({
    protocol      = optional(string, "TCP")
    source        = string
    destination   = string
    src_port_low  = optional(number, 0)
    src_port_high = optional(number, 0)
    dst_port_low  = optional(number, 0)
    dst_port_high = optional(number, 0)
    action        = optional(string, "accept")
    description   = string
  }))
  default = []
}
