terraform {
  required_version = ">= 1.10.0"

  required_providers {
    scaleway = {
      source  = "scaleway/scaleway"
      version = "~> 2.79"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
}

locals {
  common_tags = concat(
    ["tet", "tier:platform", "managed-by:terraform"],
    var.tags,
  )

  # Première adresse du tunnel : celle de la passerelle.
  gateway_tunnel_address = cidrhost(var.tunnel_cidr, 1)

  cloud_init = templatefile("${path.module}/cloud-init.yaml.tftpl", {
    ssh_authorized_keys   = var.ssh_authorized_keys
    sshd_host_private_key = trimspace(tls_private_key.sshd_host.private_key_openssh)
    sshd_host_public_key  = trimspace(tls_private_key.sshd_host.public_key_openssh)
    private_key           = trimspace(base64decode(data.scaleway_secret_version.private_key.data))
    listen_port           = var.listen_port
    gateway_address       = "${local.gateway_tunnel_address}/${split("/", var.tunnel_cidr)[1]}"
    tunnel_cidr           = var.tunnel_cidr
    # Même plage que les règles de retour de l'ACL (vpn_acl_return_rules, platform).
    nat_tcp_ports = "32768-60999"
    routed_cidrs  = var.routed_cidrs
    peers         = var.peers
  })
}

# Clé privée WireGuard de la passerelle, générée hors Terraform
# (wg genkey) et déposée à la main dans Secret Manager : elle survit ainsi au
# remplacement de la VM, et les postes des opérateurs gardent la même
# publique. Elle transite par le state et le user_data, comme la clé d'hôte
# sshd ci-dessous.
data "scaleway_secret_version" "private_key" {
  secret_name = var.private_key_secret_name
  revision    = "latest"
}

# Clé d'hôte sshd stable malgré les remplacements de la VM (cf. app-server).
resource "tls_private_key" "sshd_host" {
  algorithm = "ED25519"
}

# Seul WireGuard est ouvert au monde : il ne répond à aucun paquet non
# authentifié. Le 22 public est fermé par défaut, les opérateurs joignent la
# passerelle par le tunnel ; ssh_allowed_ips sert de secours.
resource "scaleway_instance_security_group" "vpn" {
  name                    = "${var.name}-sg"
  description             = "Passerelle WireGuard des opérateurs. UDP ${var.listen_port} ouvert, SSH public fermé sauf secours."
  inbound_default_policy  = "drop"
  outbound_default_policy = "accept"
  external_rules          = true
  zone                    = var.zone
}

resource "scaleway_instance_security_group_rules" "vpn" {
  security_group_id = scaleway_instance_security_group.vpn.id

  inbound_rule {
    action   = "accept"
    protocol = "UDP"
    port     = var.listen_port
    ip_range = "0.0.0.0/0"
  }

  dynamic "inbound_rule" {
    for_each = var.ssh_allowed_ips
    content {
      action   = "accept"
      protocol = "TCP"
      port     = 22
      ip_range = inbound_rule.value
    }
  }
}

# IP publique conservée quand la VM est remplacée : c'est l'Endpoint des
# postes opérateurs et la source autorisée sur le 22 des serveurs applicatifs.
resource "scaleway_instance_ip" "vpn" {
  zone = var.zone
  tags = local.common_tags
}

# IP privée réservée : source des flux autorisés par l'ACL du VPC (la
# passerelle masque le sous-réseau du tunnel derrière elle).
resource "scaleway_ipam_ip" "vpn" {
  address = var.private_ipv4_address

  source {
    private_network_id = var.private_network_id
  }

  tags = local.common_tags
}

# La VM ne porte aucun état : toute sa configuration (pairs, routes) vient de
# cloud-init. Un changement la remplace plutôt que de la reconfigurer en SSH,
# au prix d'une coupure du tunnel d'une à deux minutes.
resource "terraform_data" "config" {
  input = sha256(local.cloud_init)
}

resource "scaleway_instance_server" "vpn" {
  name  = var.name
  type  = var.instance_type
  image = "ubuntu_jammy"
  zone  = var.zone

  security_group_id = scaleway_instance_security_group.vpn.id
  ip_id             = scaleway_instance_ip.vpn.id

  user_data = {
    cloud-init = local.cloud_init
  }

  tags = local.common_tags

  lifecycle {
    replace_triggered_by = [terraform_data.config]
  }
}

resource "scaleway_instance_private_nic" "vpn" {
  server_id          = scaleway_instance_server.vpn.id
  private_network_id = var.private_network_id
  ipam_ip_ids        = [scaleway_ipam_ip.vpn.id]
  zone               = var.zone
}
