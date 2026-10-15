terraform {
  required_providers {
    scaleway = {
      source  = "scaleway/scaleway"
      version = "~> 2.79"
    }
  }
}

locals {
  common_tags = ["tet", "managed-by:terraform"]
}

# VPC unique, partagé par tous les environnements.
#
# enable_routing permet le routage entre Private Networks du VPC : c'est ce qui
# autorise le serveur Coolify (PN platform) à joindre les serveurs applicatifs
# (PN prod / nonprod / preview) en SSH sur leur IP privée, sans exposer le port
# 22 sur Internet.
#
# Attention : enable_routing et enable_custom_routes_propagation ne peuvent pas
# être désactivés après coup (contrainte Scaleway).
resource "scaleway_vpc" "main" {
  name           = var.vpc_name
  region         = var.region
  enable_routing = true

  tags = local.common_tags
}

# Un Private Network par tier. Le découpage suit les frontières de confiance,
# pas les environnements logiques : staging n'a pas son propre PN puisque ses
# conteneurs vivent sur le serveur nonprod et parlent à leur Postgres via le
# réseau Docker local.
resource "scaleway_vpc_private_network" "main" {
  for_each = var.private_networks

  name   = "tet-${each.key}-pn"
  vpc_id = scaleway_vpc.main.id
  region = var.region

  ipv4_subnet {
    subnet = each.value.ipv4_subnet
  }

  tags = concat(local.common_tags, ["tier:${each.key}"])
}

# ACL au niveau VPC : filtre le trafic *routé entre* Private Networks.
#
# Le trafic intra-PN reste en L2 et n'est pas concerné — inutile donc d'ouvrir
# les flux app → Postgres/Redis, qui vivent dans le même PN que leur serveur.
#
# Les Security Groups Scaleway ne filtrent que l'interface publique : cette ACL
# est le seul point de contrôle du trafic privé, d'où le default_policy = drop.
resource "scaleway_vpc_acl" "main" {
  count = var.acl_enabled ? 1 : 0

  vpc_id         = scaleway_vpc.main.id
  region         = var.region
  is_ipv6        = false
  default_policy = var.acl_default_policy

  dynamic "rules" {
    for_each = var.acl_rules
    content {
      protocol      = rules.value.protocol
      source        = rules.value.source
      destination   = rules.value.destination
      src_port_low  = rules.value.src_port_low
      src_port_high = rules.value.src_port_high
      dst_port_low  = rules.value.dst_port_low
      dst_port_high = rules.value.dst_port_high
      action        = rules.value.action
      description   = rules.value.description
    }
  }
}

# Pendant IPv6 de l'ACL ci-dessus. Chaque VPC a deux ACL indépendantes, une par
# version d'IP, et chaque Private Network reçoit d'office un /64 IPv6 que l'on
# ne peut ni choisir ni désactiver. Sans cette ACL, le trafic IPv6 est routé
# librement entre PN : prod redeviendrait joignable depuis nonprod et preview.
#
# Aucun flux IPv6 légitime entre PN : Coolify pilote les serveurs sur leur IPv4
# privée. La règle drop explicite double le default_policy, par précaution si
# Scaleway n'appliquait pas ce dernier à une liste sans règle.
resource "scaleway_vpc_acl" "ipv6" {
  count = var.acl_enabled ? 1 : 0

  vpc_id         = scaleway_vpc.main.id
  region         = var.region
  is_ipv6        = true
  default_policy = "drop"

  rules {
    protocol    = "ANY"
    source      = "::/0"
    destination = "::/0"
    action      = "drop"
    description = "Aucun trafic IPv6 entre Private Networks"
  }
}
