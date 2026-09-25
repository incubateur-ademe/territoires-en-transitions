variable "scaleway_project_id" {
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
    private_ipv4_address. Les modifier ici sans les reporter dans prod/,
    nonprod/ et preview/ casse le pilotage SSH par Coolify.

    10.0.2.0/24 est volontairement laissé libre : staging n'a pas de Private
    Network propre, ses conteneurs vivent sur le serveur nonprod.
  EOT
  type = map(object({
    ipv4_subnet         = string
    server_ipv4_address = string
  }))
  default = {
    platform = { ipv4_subnet = "10.0.0.0/24", server_ipv4_address = "10.0.0.10" }
    nonprod  = { ipv4_subnet = "10.0.1.0/24", server_ipv4_address = "10.0.1.10" }
    prod     = { ipv4_subnet = "10.0.3.0/24", server_ipv4_address = "10.0.3.10" }
    preview  = { ipv4_subnet = "10.0.4.0/24", server_ipv4_address = "10.0.4.10" }
  }
  validation {
    condition     = contains(keys(var.network_plan), "platform")
    error_message = "network_plan doit contenir une entrée 'platform' (le tier du control plane Coolify)."
  }
}

variable "acl_enabled" {
  description = "Crée l'ACL du VPC. Ne passer à false que pour diagnostiquer un problème de routage privé : le trafic entre tiers devient alors entièrement ouvert."
  type        = bool
  default     = true
}

variable "acl_allow_return_traffic" {
  description = "Ajoute les règles ACL de trafic retour (serveurs applicatifs -> control plane, port source 22). À laisser à true tant que le caractère stateful des ACL VPC Scaleway n'est pas vérifié sur l'infra réelle."
  type        = bool
  default     = true
}

# --- Control plane Coolify ---

variable "coolify_name" {
  description = "Nom de la VM Coolify."
  type        = string
  default     = "tet-platform-coolify"
}

variable "coolify_instance_type" {
  description = "Type d'instance du control plane. Démarrer petit et monter après mesure : Coolify n'héberge aucune application métier."
  type        = string
  default     = "PRO2-XXS"
}

variable "coolify_root_volume_size_in_gb" {
  description = "Taille du volume racine du control plane, en GB."
  type        = number
  default     = 50
}

variable "coolify_version" {
  description = "Version stable de Coolify à installer (sans préfixe v). Source de vérité : https://cdn.coollabs.io/coolify/versions.json (clé coolify.v4.version)."
  type        = string
  default     = "4.3.19"
}

variable "coolify_fqdn" {
  description = "FQDN du dashboard Coolify. Son enregistrement A est posé manuellement chez le registrar, l'apex n'étant pas géré ici."
  type        = string
  default     = "coolify.territoiresentransitions.fr"
}

variable "coolify_ssh_allowed_ips" {
  description = "CIDR autorisés en SSH sur le control plane. C'est le bastion vers tous les serveurs applicatifs : n'y lister que les IP des opérateurs, jamais 0.0.0.0/0."
  type        = list(string)
  default     = []
}

variable "coolify_ssh_authorized_keys" {
  description = "Clés publiques SSH des opérateurs, injectées sur l'utilisateur tet-ops du bastion."
  type        = list(string)
  default     = []
}

# --- DNS ---

variable "dns_enabled" {
  description = "Crée les zones DNS de sous-domaine. Laisser à false tant que le domaine racine n'a pas été enregistré comme domaine externe chez Scaleway (cf. commentaire dans main.tf)."
  type        = bool
  default     = false
}

variable "root_domain" {
  description = "Domaine racine. Reste géré par le registrar actuel : seules les zones de sous-domaine listées dans dns_subdomains lui sont déléguées."
  type        = string
  default     = "territoiresentransitions.fr"
}

variable "dns_subdomains" {
  description = "Sous-domaines délégués à Scaleway. La prod en est volontairement absente : ses enregistrements restent chez le registrar."
  type        = list(string)
  default     = ["preprod", "staging", "preview"]
}

# --- Stockage ---

variable "coolify_backups_bucket_name" {
  description = "Nom du bucket Object Storage des backups Coolify. Doit être globalement unique. Transverse à tous les environnements."
  type        = string
  default     = "tet-coolify-backups"
}
