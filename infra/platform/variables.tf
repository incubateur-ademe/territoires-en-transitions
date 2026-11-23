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

variable "vpc_name" {
  description = "Nom du VPC partagé par tous les tiers."
  type        = string
  default     = "tet"
}

variable "network_plan" {
  description = <<-EOT
    Plan d'adressage : un /24 par tier, plus l'IP privée fixe de son serveur.

    Ces adresses sont le contrat entre ce stack et les stacks applicatifs :
    chaque stack déclare la même valeur dans sa propre variable
    private_ipv4_address. Les modifier ici sans les reporter dans nonprod/,
    preview/ et data/ désaligne l'ACL du VPC.

    La prod n'est pas dans ce VPC : elle a son propre projet et son propre VPC
    (infra/prod), sans lien réseau avec celui-ci.

    10.0.3.0/24 est volontairement laissé libre : c'était
    l'ancien PN prod, le garder libre évite toute confusion avec le VPC prod
    qui l'utilise.
  EOT
  type = map(object({
    ipv4_subnet         = string
    server_ipv4_address = string
  }))
  default = {
    platform = { ipv4_subnet = "10.0.0.0/24", server_ipv4_address = "10.0.0.10" }
    nonprod  = { ipv4_subnet = "10.0.1.0/24", server_ipv4_address = "10.0.1.10" }
    data     = { ipv4_subnet = "10.0.2.0/24", server_ipv4_address = "10.0.2.10" }
    preview  = { ipv4_subnet = "10.0.4.0/24", server_ipv4_address = "10.0.4.10" }
  }
  validation {
    condition     = contains(keys(var.network_plan), "platform")
    error_message = "network_plan doit contenir une entrée 'platform' (le tier de la passerelle VPN)."
  }
}

variable "acl_enabled" {
  description = "Crée l'ACL du VPC. Ne passer à false que pour diagnostiquer un problème de routage privé : le trafic entre tiers devient alors entièrement ouvert."
  type        = bool
  default     = true
}

variable "acl_allow_return_traffic" {
  description = "Ajoute les règles ACL de trafic retour (serveurs applicatifs -> passerelle VPN). À laisser à true tant que le caractère stateful des ACL VPC Scaleway n'est pas vérifié sur l'infra réelle."
  type        = bool
  default     = true
}

# --- Passerelle VPN des opérateurs ---

variable "vpn_private_ipv4_address" {
  description = "IP privée fixe de la passerelle WireGuard, dans le Private Network platform."
  type        = string
  default     = "10.0.0.11"
}

variable "vpn_tunnel_cidr" {
  description = "Sous-réseau du tunnel WireGuard. Hors 10.0.0.0/16 pour ne chevaucher aucun Private Network."
  type        = string
  default     = "10.99.0.0/24"
}

variable "vpn_private_key_secret_name" {
  description = "Secret Secret Manager (projet principal) portant la clé privée WireGuard de la passerelle, déposée à la main (cf. README)."
  type        = string
  default     = "tet-platform-vpn-private-key"
}

variable "vpn_peers" {
  description = <<-EOT
    Personnes autorisées sur le VPN, par nom : clé publique WireGuard et adresse
    dans vpn_tunnel_cidr (sans masque, à partir de .2).

    tiers restreint un pair aux tiers listés (Private Network et IP publique du
    serveur) : la passerelle jette le reste. Null (défaut) : tout ce que relaie
    le tunnel, prod comprise. Ex. le data analyst : tiers = ["data"].
  EOT
  type = map(object({
    public_key = string
    address    = string
    tiers      = optional(list(string))
  }))
  default = {}
  validation {
    condition     = alltrue([for p in values(var.vpn_peers) : can(cidrhost("${p.address}/32", 0)) && p.address != cidrhost(var.vpn_tunnel_cidr, 1)])
    error_message = "Chaque adresse de pair doit être une IPv4 sans masque, différente de celle de la passerelle (première adresse du tunnel)."
  }
  validation {
    condition = alltrue([
      for p in values(var.vpn_peers) : p.tiers == null ? true : length(p.tiers) > 0 && alltrue([for t in p.tiers : contains(["nonprod", "preview", "prod", "data"], t)])
    ])
    error_message = "tiers : null, ou une liste non vide parmi nonprod, preview, prod, data."
  }
}

variable "vpn_ssh_allowed_ips" {
  description = "CIDR autorisés en SSH sur l'IP publique de la passerelle, en secours si le tunnel tombe. Vide par défaut."
  type        = list(string)
  default     = []
  validation {
    condition     = alltrue([for c in var.vpn_ssh_allowed_ips : can(cidrhost(c, 0)) && !startswith(c, "0.0.0.0/")])
    error_message = "vpn_ssh_allowed_ips : des CIDR (ex. 203.0.113.10/32), jamais 0.0.0.0/0."
  }
}

variable "vpn_ssh_authorized_keys" {
  description = "Clés publiques SSH des opérateurs sur l'utilisateur tet-ops de la passerelle. Versionnée dans terraform.tfvars : une valeur locale écraserait celles des autres opérateurs."
  type        = list(string)
}

# --- Stockage ---

variable "database_backups_bucket_name" {
  description = "Nom du bucket Object Storage des dumps quotidiens de la BDD de prod. Doit être globalement unique."
  type        = string
  default     = "tet-database-backups"
}

variable "backups_lock_days" {
  description = "Durée du verrou Object Lock (COMPLIANCE) appliqué à chaque objet des buckets de backups, en jours. Ne peut pas être raccourcie pour les objets déjà écrits."
  type        = number
  default     = 14
}

variable "backups_noncurrent_version_days" {
  description = "Délai avant purge d'une version supprimée ou remplacée, en jours. Une version encore verrouillée n'est purgée qu'à l'expiration du verrou."
  type        = number
  default     = 7
}

# --- Projets créés par l'admin de l'organisation ---

variable "database_backups_project_id" {
  description = "ID du projet Scaleway des dumps de la BDD de prod (tet-database-backups), créé par un admin de l'organisation."
  type        = string
  validation {
    condition     = can(regex("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", var.database_backups_project_id))
    error_message = "database_backups_project_id doit être un UUID de projet Scaleway."
  }
}

variable "prod_project_id" {
  description = "ID du projet Scaleway de production (tet-prod), créé par un admin de l'organisation. Relayé en output pour infra/prod."
  type        = string
  validation {
    condition     = can(regex("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", var.prod_project_id))
    error_message = "prod_project_id doit être un UUID de projet Scaleway."
  }
}
