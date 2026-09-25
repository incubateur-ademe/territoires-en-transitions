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
