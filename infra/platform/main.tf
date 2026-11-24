# Socle transverse : réseau, passerelle VPN des opérateurs et stockage.
# Rien ici n'appartient à un environnement applicatif — les stacks nonprod et
# preview viennent s'y brancher.
#
# La prod est à part : projet Scaleway dédié (créé par un admin), VPC propre (créé par
# infra/prod), aucun lien réseau avec le VPC partagé. Coolify (instance de
# l'incubateur) et le VPN la joignent en SSH sur son IP publique.

# IP publiques des serveurs applicatifs, lues sur l'infra réelle. Les serveurs
# dépendent de ce stack (réseau, VPN) : la lecture est donc souple. Sur une
# infra vide, la liste est vide ; un second apply de platform, après les
# stacks de tier, ajoute leurs IP aux routes du tunnel.
#
# L'ordre (nonprod, preview, prod, data) fixe celui des routes dans le cloud-init de
# la passerelle : le changer la remplace.
data "scaleway_instance_servers" "app" {
  for_each = {
    nonprod = var.main_project_id
    preview = var.main_project_id
    prod    = var.prod_project_id
    data    = var.main_project_id
  }

  name       = "tet-${each.key}-apps"
  project_id = each.value
  zone       = var.scaleway_zone
}

# Lecture souple, mais pas muette : un serveur absent sort sa route du tunnel,
# et le plan ne le montre pas (user_data sensible). Avertissement seulement :
# sur une infra vide, c'est l'état attendu.
check "app_servers_routed" {
  assert {
    condition = alltrue([
      for tier, ds in data.scaleway_instance_servers.app :
      length([for s in ds.servers : s if s.name == "tet-${tier}-apps"]) == 1
    ])
    error_message = "Serveur applicatif absent (ou en double) : sa route sort du tunnel VPN. Réappliquer platform une fois le serveur recréé."
  }
}

locals {
  app_server_public_ips_by_tier = {
    for tier, ds in data.scaleway_instance_servers.app : tier => flatten([
      for s in ds.servers : [
        for ip in s.public_ips : ip.address if ip.family == "inet"
      ] if s.name == "tet-${tier}-apps"
    ])
  }

  app_server_public_ips = flatten([
    for tier in ["nonprod", "preview", "prod", "data"] : local.app_server_public_ips_by_tier[tier]
  ])

  # Tiers portant un serveur applicatif. Le tier platform n'en fait pas partie :
  # il ne porte que la passerelle VPN.
  app_tiers = [for k, v in var.network_plan : k if k != "platform"]

  # --- Passerelle VPN des opérateurs ---
  #
  # Ce que le tunnel relaie : tout le VPC tet, et les IP publiques des
  # serveurs applicatifs (la prod n'a aucune route depuis ce VPC : on la joint
  # sur son IP publique, qui autorise celle de la passerelle).
  vpn_routed_cidrs = concat(
    [for tier, plan in var.network_plan : plan.ipv4_subnet],
    [for ip in local.app_server_public_ips : "${ip}/32"],
  )

  vpn_server_cidr = "${var.vpn_private_ipv4_address}/32"

  # Pairs à accès restreint : leurs tiers, traduits en destinations (Private
  # Network s'il y en a un, IP publique du serveur). La prod n'a que la seconde.
  vpn_peers = {
    for name, p in var.vpn_peers : name => {
      public_key = p.public_key
      address    = p.address
      routed_cidrs = p.tiers == null ? null : concat(
        [for t in p.tiers : var.network_plan[t].ipv4_subnet if contains(keys(var.network_plan), t)],
        flatten([for t in p.tiers : [for ip in local.app_server_public_ips_by_tier[t] : "${ip}/32"]]),
      )
    }
  }

  # Ports privés ouverts aux opérateurs dans chaque tier : SSH, Postgres et
  # Redis managés (preprod). Destination : tout le /24, les bases managées y
  # ont leur propre IP.
  vpn_acl_ports = { ssh = 22, postgres = 5432, redis = 6379 }

  vpn_acl_rules = flatten([
    for tier in local.app_tiers : [
      for name, port in local.vpn_acl_ports : {
        protocol      = "TCP"
        source        = local.vpn_server_cidr
        destination   = var.network_plan[tier].ipv4_subnet
        src_port_low  = 0
        src_port_high = 65535
        dst_port_low  = port
        dst_port_high = port
        action        = "accept"
        description   = "VPN opérateurs -> ${tier} (${name})"
      }
    ]
  ])

  vpn_acl_return_rules = var.acl_allow_return_traffic ? flatten([
    for tier in local.app_tiers : [
      for name, port in local.vpn_acl_ports : {
        protocol      = "TCP"
        source        = var.network_plan[tier].ipv4_subnet
        destination   = local.vpn_server_cidr
        src_port_low  = port
        src_port_high = port
        # Plage imposée au MASQUERADE TCP de la passerelle (modules/vpn/main.tf).
        dst_port_low  = 32768
        dst_port_high = 60999
        action        = "accept"
        description   = "Retour ${tier} (${name}) -> VPN opérateurs"
      }
    ]
  ]) : []
}

module "network" {
  source = "../modules/network"

  region   = var.scaleway_region
  vpc_name = var.vpc_name

  private_networks = {
    for tier, plan in var.network_plan : tier => { ipv4_subnet = plan.ipv4_subnet }
  }

  acl_enabled        = var.acl_enabled
  acl_default_policy = "drop"
  acl_rules = concat(
    local.vpn_acl_rules, local.vpn_acl_return_rules,
  )
}

# Accès des opérateurs aux serveurs et aux bases privées (cf. README « Accès aux
# serveurs (VPN) »).
module "vpn" {
  source = "../modules/vpn"

  zone                    = var.scaleway_zone
  private_network_id      = module.network.private_network_ids["platform"]
  private_ipv4_address    = var.vpn_private_ipv4_address
  private_key_secret_name = var.vpn_private_key_secret_name
  tunnel_cidr             = var.vpn_tunnel_cidr
  routed_cidrs            = local.vpn_routed_cidrs
  peers                   = local.vpn_peers
  ssh_allowed_ips         = var.vpn_ssh_allowed_ips
  ssh_authorized_keys     = var.vpn_ssh_authorized_keys
}

# --- Projet de production ---
#
# La prod vit dans son propre projet Scaleway (var.prod_project_id), où
# infra/prod crée son VPC et ses ressources. Le projet est créé par un admin de
# l'organisation : créer un projet exige des droits d'organisation que les
# credentials Terraform n'ont pas. Ce stack ne fait que relayer son ID.

# --- Stockage des backups ---
#
# Bucket des dumps quotidiens de la BDD de prod (.github/workflows/backup-database.yml),
# qui alimentent aussi les restaurations de staging et de preprod.
#
# Projet Scaleway dédié (var.database_backups_project_id) : les permissions IAM Object
# Storage valent pour un projet entier, pas pour un bucket. Les dumps ne sont pas
# chiffrés : aucune autre clé ne doit les lire ni en déposer un faux, que restore.sh
# restaurerait.
#
# Object Lock en mode COMPLIANCE : aucune version ne peut être supprimée avant
# l'échéance, par personne, pas même un admin de l'organisation. Des credentials
# compromis ne peuvent donc pas effacer l'historique. object_lock_enabled ne peut
# être posé qu'à la création du bucket (ForceNew).
#
# Pas de règle d'expiration : la rétention (14 jours, puis 1 par semaine jusqu'à 4
# semaines, puis 1 par mois jusqu'à 12 mois) est appliquée par data_layer/backup/cleanup.sh. Ses suppressions posent
# des delete markers, purgés par la règle noncurrent-versions une fois le verrou
# expiré.
resource "scaleway_object_bucket" "database_backups" {
  name       = var.database_backups_bucket_name
  region     = var.scaleway_region
  project_id = var.database_backups_project_id

  object_lock_enabled = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    id      = "noncurrent-versions"
    enabled = true

    abort_incomplete_multipart_upload_days = 1

    noncurrent_version_expiration {
      noncurrent_days = var.backups_noncurrent_version_days
    }

    expiration {
      expired_object_delete_marker = true
    }
  }

  tags = {
    tier       = "platform"
    purpose    = "database-backups"
    managed_by = "terraform"
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "scaleway_object_bucket_lock_configuration" "database_backups" {
  bucket     = scaleway_object_bucket.database_backups.name
  region     = var.scaleway_region
  project_id = var.database_backups_project_id

  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = var.backups_lock_days
    }
  }
}
