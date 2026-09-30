variable "name" {
  description = "Nom de la VM Coolify. Sert aussi de préfixe au security group et au secret de la clé host."
  type        = string
  default     = "tet-platform-coolify"
}

variable "zone" {
  description = "Zone Scaleway où provisionner la VM Coolify."
  type        = string
  default     = "fr-par-1"
}

variable "instance_type" {
  description = "Type d'instance Scaleway pour le control plane. Coolify y fait tourner son app Laravel, son Postgres, son Redis, Soketi et Traefik — mais aucune application métier."
  type        = string
  default     = "PRO2-XXS"
}

variable "root_volume_size_in_gb" {
  description = "Taille du volume racine en GB. Le control plane ne construit ni ne stocke d'images applicatives : 50 GB suffisent."
  type        = number
  default     = 50
}

variable "coolify_version" {
  description = "Version stable de Coolify à installer (sans préfixe v). Source de vérité : https://cdn.coollabs.io/coolify/versions.json (clé coolify.v4.version). Les montées de version sur une VM existante sont manuelles (cloud-init ne rejoue pas)."
  type        = string
  default     = "4.3.19"
}

variable "fqdn" {
  description = "FQDN du dashboard Coolify (ex. coolify.territoiresentransitions.fr). Injecté comme APP_URL ; le réglage Settings > Instance Domain reste à faire une fois dans l'UI pour déclencher l'émission du certificat."
  type        = string
}

variable "private_network_id" {
  description = "ID du Private Network platform. C'est par ce réseau que Coolify joint les serveurs applicatifs en SSH."
  type        = string
}

variable "private_ipv4_address" {
  description = "IP privée fixe à réserver pour le control plane. Référencée par les règles ACL du VPC comme source autorisée du SSH."
  type        = string
}

variable "ssh_allowed_ips" {
  description = "CIDR autorisés à joindre le port 22. Ce serveur étant le bastion vers tous les autres, y lister uniquement les IP des opérateurs. Ne jamais mettre 0.0.0.0/0."
  type        = list(string)
}

variable "ssh_authorized_keys" {
  description = "Clés publiques SSH injectées sur l'utilisateur tet-ops. Ce sont les clés des opérateurs qui utiliseront le bastion."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags additionnels appliqués aux ressources du control plane."
  type        = list(string)
  default     = []
}
