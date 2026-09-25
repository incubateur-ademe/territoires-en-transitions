# Socle transverse : réseau, control plane Coolify, zones DNS et stockage.
# Rien ici n'appartient à un environnement applicatif — les stacks prod,
# nonprod et preview viennent s'y brancher.

locals {
  # Tiers portant un serveur applicatif. Le tier platform n'en fait pas partie :
  # son serveur est le control plane, pas une cible de déploiement.
  app_tiers = [for k, v in var.network_plan : k if k != "platform"]

  platform_server_cidr = "${var.network_plan["platform"].server_ipv4_address}/32"

  # Seul flux inter-Private Networks autorisé : le SSH du control plane vers
  # chaque serveur applicatif. Tout le reste tombe dans le default_policy = drop,
  # ce qui isole prod, nonprod et preview les uns des autres.
  acl_ssh_rules = [
    for tier in local.app_tiers : {
      protocol      = "TCP"
      source        = local.platform_server_cidr
      destination   = "${var.network_plan[tier].server_ipv4_address}/32"
      dst_port_low  = 22
      dst_port_high = 22
      action        = "accept"
      description   = "SSH Coolify -> serveur ${tier}"
    }
  ]

  # Trafic retour. Les ACL VPC Scaleway s'évaluent par direction : sans ces
  # règles, les réponses SSH des serveurs applicatifs seraient droppées et
  # Coolify verrait tous ses serveurs injoignables.
  #
  # À garder tant que le comportement n'a pas été confirmé sur l'infra réelle :
  # une règle en trop est sans effet, une règle manquante coupe le pilotage.
  acl_ssh_return_rules = var.acl_allow_return_traffic ? [
    for tier in local.app_tiers : {
      protocol      = "TCP"
      source        = "${var.network_plan[tier].server_ipv4_address}/32"
      destination   = local.platform_server_cidr
      src_port_low  = 22
      src_port_high = 22
      action        = "accept"
      description   = "Retour SSH serveur ${tier} -> Coolify"
    }
  ] : []
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
  acl_rules          = concat(local.acl_ssh_rules, local.acl_ssh_return_rules)
}

module "coolify" {
  source = "../modules/coolify-controller"

  name                   = var.coolify_name
  zone                   = var.scaleway_zone
  instance_type          = var.coolify_instance_type
  root_volume_size_in_gb = var.coolify_root_volume_size_in_gb
  coolify_version        = var.coolify_version
  fqdn                   = var.coolify_fqdn

  private_network_id   = module.network.private_network_ids["platform"]
  private_ipv4_address = var.network_plan["platform"].server_ipv4_address

  ssh_allowed_ips     = var.coolify_ssh_allowed_ips
  ssh_authorized_keys = var.coolify_ssh_authorized_keys
}

# --- DNS ---
#
# Zones de sous-domaine déléguées à Scaleway. L'apex et la production restent
# chez le registrar actuel : on ne déplace pas ses NS.
#
# Prérequis manuel, à faire une fois avant le premier apply avec dns_enabled :
#   1. scw domain external-domain register domain=<root_domain>
#      (validation par enregistrement TXT d'ownership — les NS de l'apex ne
#      bougent pas)
#   2. après apply, poser chez le registrar les NS de chaque zone créée ici
#      (output dns_zone_nameservers)
#
# dns_enabled reste à false tant que l'étape 1 n'est pas faite, pour que le
# reste du socle puisse être appliqué sans attendre.
resource "scaleway_domain_zone" "env" {
  for_each = var.dns_enabled ? toset(var.dns_subdomains) : toset([])

  domain    = var.root_domain
  subdomain = each.value
}

# --- Stockage ---
#
# Bucket cible des backups Coolify (bases de données et volumes de tous les
# environnements). Transverse : un seul S3 storage est enregistré dans Coolify,
# d'où le nom sans préfixe d'environnement.
#
# Pas d'Object Lock ici, contrairement au bucket de state : Coolify doit pouvoir
# supprimer librement selon la rétention configurée sur chaque backup.
resource "scaleway_object_bucket" "coolify_backups" {
  name   = var.coolify_backups_bucket_name
  region = var.scaleway_region

  versioning {
    enabled = true
  }

  tags = {
    tier       = "platform"
    purpose    = "coolify-backups"
    managed_by = "terraform"
  }
}
