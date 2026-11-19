variable "name" {
  description = "Nom de la VM de la passerelle. Sert aussi de préfixe au security group."
  type        = string
  default     = "tet-platform-vpn"
}

variable "zone" {
  description = "Zone Scaleway de la passerelle."
  type        = string
  default     = "fr-par-1"
}

variable "instance_type" {
  description = "Type d'instance. WireGuard ne demande presque rien : la plus petite suffit."
  type        = string
  default     = "PLAY2-PICO"
}

variable "private_network_id" {
  description = "ID du Private Network platform, d'où la passerelle joint les autres Private Networks."
  type        = string
}

variable "private_ipv4_address" {
  description = "IP privée fixe de la passerelle. Source des flux opérateurs dans l'ACL du VPC."
  type        = string
}

variable "private_key_secret_name" {
  description = "Secret Secret Manager portant la clé privée WireGuard de la passerelle (sortie de wg genkey), déposée à la main."
  type        = string
}

variable "listen_port" {
  description = "Port UDP d'écoute de WireGuard."
  type        = number
  default     = 51820
}

variable "tunnel_cidr" {
  description = "Sous-réseau du tunnel. La passerelle en prend la première adresse, chaque opérateur une autre. Ne doit chevaucher aucun réseau du VPC."
  type        = string
}

variable "routed_cidrs" {
  description = "Destinations que les opérateurs peuvent joindre par le tunnel. Tout le reste est refusé par la passerelle. Ce sont aussi les AllowedIPs du poste opérateur."
  type        = list(string)
}

variable "peers" {
  description = "Opérateurs, par nom : clé publique WireGuard et adresse dans le tunnel (sans masque)."
  type = map(object({
    public_key = string
    address    = string
  }))
}

variable "ssh_allowed_ips" {
  description = "CIDR autorisés en SSH sur l'IP publique, en secours si le tunnel tombe. Vide par défaut : on administre la passerelle par le tunnel."
  type        = list(string)
  default     = []
}

variable "ssh_authorized_keys" {
  description = "Clés publiques SSH des opérateurs, sur l'utilisateur tet-ops de la passerelle."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags additionnels."
  type        = list(string)
  default     = []
}
