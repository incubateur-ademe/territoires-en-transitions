terraform {
  required_providers {
    scaleway = {
      source  = "scaleway/scaleway"
      version = "~> 2.50"
    }
  }
}

locals {
  common_tags = concat(
    ["tet", "env:${var.environment}", "managed-by:terraform"],
    var.tags,
  )
}

# Port 8000 (dashboard Coolify) est volontairement absent des règles inbound :
# la politique par défaut est DROP, donc le dashboard n'est accessible qu'en
# SSH tunnel (ssh -L 8000:localhost:8000 tet-ops@<ip>) ou via un bastion VPN.
#
# external_rules = true + scaleway_instance_security_group_rules séparé est le
# pattern recommandé pour les dynamic blocks : évite les diffs d'ordre sur plan.
resource "scaleway_instance_security_group" "coolify" {
  name                    = "tet-${var.environment}-coolify-sg"
  description             = "Coolify VM - TET ${var.environment}. Port 8000 bloqué publiquement (accès via SSH tunnel uniquement)."
  inbound_default_policy  = "drop"
  outbound_default_policy = "accept"
  external_rules          = true
  zone                    = var.zone
}

resource "scaleway_instance_security_group_rules" "coolify" {
  security_group_id = scaleway_instance_security_group.coolify.id

  dynamic "inbound_rule" {
    for_each = var.ssh_allowed_ips
    content {
      action   = "accept"
      protocol = "TCP"
      port     = 22
      ip_range = inbound_rule.value
    }
  }

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

resource "scaleway_instance_ip" "coolify" {
  zone = var.zone
  tags = local.common_tags
}

resource "scaleway_instance_server" "coolify" {
  name  = "tet-${var.environment}-coolify"
  type  = var.instance_type
  image = "ubuntu_jammy"
  zone  = var.zone

  security_group_id = scaleway_instance_security_group.coolify.id
  ip_id             = scaleway_instance_ip.coolify.id

  root_volume {
    size_in_gb            = var.root_volume_size_in_gb
    delete_on_termination = true
  }

  user_data = {
    cloud-init = templatefile("${path.module}/cloud-init.yaml.tftpl", {
      ssh_authorized_keys = var.ssh_authorized_keys
    })
  }

  tags = local.common_tags

  # cloud-init ne tourne qu'au premier boot. Ignorer les changements ultérieurs
  # pour éviter une destruction/recréation accidentelle de la VM.
  lifecycle {
    ignore_changes = [user_data]
  }
}

resource "scaleway_instance_private_nic" "coolify" {
  server_id          = scaleway_instance_server.coolify.id
  private_network_id = var.private_network_id
  zone               = var.zone
}
