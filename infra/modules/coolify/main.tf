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
  common_tags = concat(
    ["tet", "tier:platform", "managed-by:terraform"],
    var.tags,
  )
}

# Clé SSH « host » que Coolify utilise pour piloter son propre serveur
# (localhost / root@host.docker.internal).
#
# Elle est maîtrisée par Terraform plutôt que laissée à Coolify : la clé
# auto-générée par install.sh est régénérée à chaque update/réinstall, ce qui
# casse la connexion (« Server is not reachable »). Ici la publique est injectée
# dans root par cloud-init et la privée vit dans Secret Manager.
#
# La clé privée transite par le state Terraform, comme les random_password
# existants. Le state est distant, chiffré au repos et à accès restreint ; la
# source de vérité partageable reste Secret Manager (R4).
resource "tls_private_key" "host" {
  algorithm = "ED25519"
}

# Clé d'hôte du serveur SSH (sshd), générée par Terraform et installée par
# cloud-init au premier boot. Sa publique est connue avant toute connexion :
# les scripts qui poussent des secrets en SSH (clé root, PAT GHCR, clés S3)
# vérifient ainsi l'hôte en mode strict, au lieu d'accepter la première clé
# venue.
#
# Contrepartie : la privée transite par le state et par le user_data de
# l'instance, lisible depuis la machine elle-même via l'API de métadonnées. Un
# attaquant déjà sur la machine pourrait s'en servir pour usurper l'hôte, mais
# il n'y gagnerait rien de plus que ce qu'il a déjà.
resource "tls_private_key" "sshd_host" {
  algorithm = "ED25519"
}

resource "scaleway_secret" "host_key" {
  name        = "${var.name}-host-ssh-key"
  description = "Clé privée SSH utilisée par Coolify pour piloter son propre serveur (localhost). Gérée par Terraform."
  tags        = local.common_tags
}

resource "scaleway_secret_version" "host_key" {
  secret_id = scaleway_secret.host_key.id
  # Le provider gère lui-même l'encodage base64 avant l'appel API.
  data = tls_private_key.host.private_key_openssh
}

# Le serveur Coolify est le seul à exposer le port 22 publiquement : il sert de
# bastion vers les serveurs applicatifs, dont le SSH n'est joignable que depuis
# le Private Network.
#
# Le port 8000 (dashboard en clair) reste fermé : le dashboard est servi en
# HTTPS sur 443 par le Traefik de Coolify, une fois le FQDN configuré.
resource "scaleway_instance_security_group" "coolify" {
  name                    = "${var.name}-sg"
  description             = "Control plane Coolify + bastion SSH. Port 8000 fermé : dashboard servi en HTTPS sur 443."
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

  # 80 doit rester ouvert au monde : challenges HTTP-01 Let's Encrypt pour le
  # certificat du dashboard.
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

# IP privée réservée : c'est la source des flux SSH vers les serveurs
# applicatifs, et donc le CIDR référencé par l'ACL du VPC.
resource "scaleway_ipam_ip" "coolify" {
  address = var.private_ipv4_address

  source {
    private_network_id = var.private_network_id
  }

  tags = local.common_tags
}

resource "scaleway_instance_server" "coolify" {
  name  = var.name
  type  = var.instance_type
  image = "ubuntu_jammy"
  zone  = var.zone

  security_group_id = scaleway_instance_security_group.coolify.id
  ip_id             = scaleway_instance_ip.coolify.id

  # Le disque racine porte la base Coolify (applications, variables d'env,
  # secrets de tous les environnements) : protégé contre la suppression via
  # l'API, et conservé si le serveur est détruit malgré tout.
  protected = true

  root_volume {
    size_in_gb            = var.root_volume_size_in_gb
    delete_on_termination = false
  }

  user_data = {
    cloud-init = templatefile("${path.module}/cloud-init.yaml.tftpl", {
      ssh_authorized_keys         = var.ssh_authorized_keys
      coolify_host_authorized_key = trimspace(tls_private_key.host.public_key_openssh)
      sshd_host_private_key       = trimspace(tls_private_key.sshd_host.private_key_openssh)
      sshd_host_public_key        = trimspace(tls_private_key.sshd_host.public_key_openssh)
      coolify_version             = var.coolify_version
      coolify_fqdn                = var.fqdn
    })
  }

  tags = local.common_tags

  # cloud-init ne tourne qu'au premier boot. Ignorer les changements ultérieurs
  # évite une destruction/recréation accidentelle du control plane.
  lifecycle {
    ignore_changes  = [user_data]
    prevent_destroy = true
  }
}

resource "scaleway_instance_private_nic" "coolify" {
  server_id          = scaleway_instance_server.coolify.id
  private_network_id = var.private_network_id
  ipam_ip_ids        = [scaleway_ipam_ip.coolify.id]
  zone               = var.zone
}
