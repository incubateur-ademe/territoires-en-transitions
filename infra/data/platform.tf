# Ressources créées par infra/platform, lues par data source plutôt que
# recopiées dans terraform.tfvars : platform doit avoir été appliqué avant.

data "scaleway_vpc_private_network" "data" {
  name       = "tet-data-pn"
  project_id = var.project_id
}

# Data source au pluriel : le singulier (scaleway_instance_server) copierait
# dans le state le user_data de la passerelle, qui porte ses clés privées
# (WireGuard, hôte SSH). Le filtre name étant une recherche partielle, on
# exige ensuite le nom exact.
data "scaleway_instance_servers" "vpn" {
  count = var.vpn_public_ip == null ? 1 : 0

  name       = "tet-platform-vpn"
  project_id = var.project_id

  lifecycle {
    postcondition {
      condition     = length([for s in self.servers : s if s.name == "tet-platform-vpn"]) == 1
      error_message = "Passerelle tet-platform-vpn introuvable (ou en double) : appliquer infra/platform d'abord, ou passer -var vpn_public_ip=<IP> en secours."
    }
  }
}

# Serveurs applicatifs autorisés sur l'endpoint public de la RDB stats, lus sur
# l'infra réelle (même lecture que infra/platform). Lecture stricte : un serveur
# absent ferait sortir son IP de l'ACL sans que le plan le montre.
data "scaleway_instance_servers" "pg_public_reader" {
  for_each = var.pg_public_reader_tiers

  name       = "tet-${each.key}-apps"
  project_id = each.key == "prod" ? var.prod_project_id : var.project_id
  zone       = var.scaleway_zone

  lifecycle {
    postcondition {
      condition     = length([for s in self.servers : s if s.name == "tet-${each.key}-apps"]) == 1
      error_message = "Serveur tet-${each.key}-apps introuvable (ou en double) : appliquer son stack d'abord, ou le retirer de pg_public_reader_tiers."
    }
  }
}

locals {
  pg_public_allowed_cidrs = {
    for tier, ds in data.scaleway_instance_servers.pg_public_reader : tier => "${one([
      for s in ds.servers : one([
        for ip in s.public_ips : ip.address if ip.family == "inet"
      ]) if s.name == "tet-${tier}-apps"
    ])}/32"
  }

  private_network_id = data.scaleway_vpc_private_network.data.id

  # var.vpn_public_ip : secours si la passerelle n'existe plus (cf. variables.tf).
  vpn_public_ip = var.vpn_public_ip != null ? var.vpn_public_ip : one([
    for s in data.scaleway_instance_servers.vpn[0].servers : one([
      for ip in s.public_ips : ip.address if ip.family == "inet"
    ]) if s.name == "tet-platform-vpn"
  ])

  # Port 22 public : l'instance Coolify de l'incubateur (var.ssh_allowed_ips)
  # et la passerelle VPN des opérateurs.
  ssh_allowed_ips = concat(var.ssh_allowed_ips, ["${local.vpn_public_ip}/32"])
}
