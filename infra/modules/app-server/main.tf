terraform {
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
  server_name = coalesce(var.name, "tet-${var.tier}-apps")
  common_tags = concat(
    ["tet", "tier:${var.tier}", "managed-by:terraform"],
    var.tags,
  )
}

# Clé SSH que Coolify utilisera pour piloter ce serveur en root.
#
# Une clé par serveur, et non une clé partagée : permet de révoquer l'accès à un
# seul serveur (ex. compromission d'une preview) sans casser les autres. La
# publique est injectée dans root via cloud-init, la privée part dans Secret
# Manager et est enregistrée dans Coolify par le stack infra/coolify.
resource "tls_private_key" "server" {
  algorithm = "ED25519"
}

resource "scaleway_secret" "server_key" {
  name        = "tet-${var.tier}-server-ssh-key"
  description = "Clé privée SSH root du serveur ${local.server_name}, utilisée par Coolify. Gérée par Terraform."
  tags        = local.common_tags
}

resource "scaleway_secret_version" "server_key" {
  secret_id = scaleway_secret.server_key.id
  # Le provider gère lui-même l'encodage base64 avant l'appel API.
  data = tls_private_key.server.private_key_openssh
}

# Security group : ne filtre que l'interface *publique* sur Scaleway.
#
# Le port 22 n'est volontairement ouvert pour personne par défaut
# (ssh_allowed_ips = []). Coolify joint ce serveur par son IP privée, et les
# humains passent par le serveur Coolify en bastion (ssh -J). Le trafic privé
# est filtré par l'ACL du VPC, pas ici.
resource "scaleway_instance_security_group" "server" {
  name                    = "${local.server_name}-sg"
  description             = "Serveur applicatif TET (${var.tier}). SSH public fermé : accès via bastion Coolify sur IP privée."
  inbound_default_policy  = "drop"
  outbound_default_policy = "accept"
  external_rules          = true
  zone                    = var.zone
}

resource "scaleway_instance_security_group_rules" "server" {
  security_group_id = scaleway_instance_security_group.server.id

  dynamic "inbound_rule" {
    for_each = var.ssh_allowed_ips
    content {
      action   = "accept"
      protocol = "TCP"
      port     = 22
      ip_range = inbound_rule.value
    }
  }

  # Trafic applicatif : Traefik (déployé par Coolify) écoute sur 80/443 et
  # termine TLS. 80 doit rester ouvert au monde pour les challenges HTTP-01
  # Let's Encrypt.
  inbound_rule {
    action   = "accept"
    protocol = "TCP"
    port     = 80
    ip_range = "0.0.0.0/0"
  }

  inbound_rule {
    action   = "accept"
    protocol = "TCP"
    port     = 443
    ip_range = "0.0.0.0/0"
  }
}

resource "scaleway_instance_ip" "server" {
  zone = var.zone
  tags = local.common_tags
}

# IP privée réservée : l'adresse que Coolify enregistre comme cible SSH du
# serveur. La réserver explicitement évite qu'un remplacement de NIC change
# l'adresse et casse la connexion côté Coolify.
resource "scaleway_ipam_ip" "server" {
  address = var.private_ipv4_address

  source {
    private_network_id = var.private_network_id
  }

  tags = local.common_tags
}

resource "scaleway_instance_server" "server" {
  name  = local.server_name
  type  = var.instance_type
  image = "ubuntu_jammy"
  zone  = var.zone

  security_group_id = scaleway_instance_security_group.server.id
  ip_id             = scaleway_instance_ip.server.id

  root_volume {
    size_in_gb            = var.root_volume_size_in_gb
    delete_on_termination = true
  }

  user_data = {
    cloud-init = templatefile("${path.module}/cloud-init.yaml.tftpl", {
      server_name         = local.server_name
      ssh_authorized_keys = var.ssh_authorized_keys
      coolify_public_key  = trimspace(tls_private_key.server.public_key_openssh)
      docker_gc_enabled   = var.docker_gc_enabled
      docker_gc_until     = var.docker_gc_until
    })
  }

  tags = local.common_tags

  # cloud-init ne tourne qu'au premier boot : ignorer les changements ultérieurs
  # évite une destruction/recréation accidentelle du serveur.
  lifecycle {
    ignore_changes = [user_data]
  }
}

resource "scaleway_instance_private_nic" "server" {
  server_id          = scaleway_instance_server.server.id
  private_network_id = var.private_network_id
  ipam_ip_ids        = [scaleway_ipam_ip.server.id]
  zone               = var.zone
}
