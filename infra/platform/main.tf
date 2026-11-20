# Socle transverse : réseau, passerelle VPN des opérateurs et stockage.
# Rien ici n'appartient à un environnement applicatif — les stacks nonprod et
# preview viennent s'y brancher.
#
# La prod est à part : projet Scaleway dédié (créé par un admin), VPC propre (créé par
# infra/prod), aucun lien réseau avec le VPC partagé. Coolify (instance de
# l'incubateur) et le VPN la joignent en SSH sur son IP publique.

locals {
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
    [for ip in var.vpn_routed_public_ips : "${ip}/32"],
  )

  vpn_server_cidr = "${var.vpn_private_ipv4_address}/32"

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
  peers                   = var.vpn_peers
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
# Bucket cible des backups des bases des applications (S3 storage de notre Team
# Coolify).
#
# Projet Scaleway dédié (var.coolify_backups_project_id) : les permissions IAM Object
# Storage valent pour un projet entier, pas pour un bucket. Dans le projet
# principal, la clé des backups pourrait aussi lire tet-tfstate, qui contient
# les mots de passe et les clés SSH. Là, elle ne voit que ce bucket.
#
# Le projet et la clé IAM sont créés par un admin de l'organisation (droits
# d'organisation requis, cf. README « Prérequis admin »).

# Object Lock en mode COMPLIANCE : aucune version ne peut être supprimée avant
# l'échéance, par personne, pas même un admin de l'organisation. Un Coolify ou
# des credentials compromis ne peuvent donc pas effacer l'historique.
#
# Les suppressions de Coolify (sa propre rétention) restent possibles : sans
# VersionId, elles posent un delete marker et la version passe « noncurrent ».
# La règle noncurrent-versions la purge ensuite, une fois le verrou expiré.
#
# object_lock_enabled ne peut être posé qu'à la création du bucket (ForceNew).
resource "scaleway_object_bucket" "coolify_backups" {
  name       = var.coolify_backups_bucket_name
  region     = var.scaleway_region
  project_id = var.coolify_backups_project_id

  object_lock_enabled = true

  versioning {
    enabled = true
  }

  # Sans cette règle, le versioning garde indéfiniment chaque backup supprimé
  # (par Coolify) : le stockage grossit sans limite.
  lifecycle_rule {
    id      = "noncurrent-versions"
    enabled = true

    abort_incomplete_multipart_upload_days = 1

    noncurrent_version_expiration {
      noncurrent_days = var.backups_noncurrent_version_days
    }

    # Retire les delete markers qui ne masquent plus aucune version.
    expiration {
      expired_object_delete_marker = true
    }
  }

  tags = {
    tier       = "platform"
    purpose    = "coolify-backups"
    managed_by = "terraform"
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "scaleway_object_bucket_lock_configuration" "coolify_backups" {
  bucket     = scaleway_object_bucket.coolify_backups.name
  region     = var.scaleway_region
  project_id = var.coolify_backups_project_id

  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = var.backups_lock_days
    }
  }
}

# Bucket des dumps quotidiens de la BDD de prod (.github/workflows/backup-database.yml),
# qui alimentent aussi les restaurations de staging et de preprod. Même verrou que
# coolify_backups, mais dans son propre projet (var.database_backups_project_id) : les
# dumps ne sont pas chiffrés, la clé des backups Coolify ne doit ni
# les lire ni en déposer un faux, que restore.sh restaurerait.
#
# Rétention par préfixe (cf. backup.sh) : chaque dump va dans daily/, celui du lundi
# aussi dans weekly/, celui du 1er du mois aussi dans monthly/. Le cycle de vie
# expire chaque préfixe, sans clé capable de supprimer. Une expiration pose un
# delete marker ; la règle noncurrent-versions purge ensuite la version, une fois
# le verrou expiré.
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

  # Durée de vie de chaque préfixe, en jours. daily ne doit pas descendre sous le
  # verrou (backups_lock_days) : un dump expiré plus tôt resterait facturé jusqu'à
  # son échéance.
  dynamic "lifecycle_rule" {
    for_each = { daily = 14, weekly = 28, monthly = 365 }
    content {
      id      = lifecycle_rule.key
      prefix  = "${lifecycle_rule.key}/"
      enabled = true

      expiration {
        days = lifecycle_rule.value
      }
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

# Clé dédiée aux backups, utilisée par le S3 storage Coolify. L'application IAM, sa politique (objets du projet backups
# uniquement, sans droit sur le cycle de vie, le verrou ni la politique du
# bucket) et sa clé sont créées par l'admin de l'organisation.
#
# Terraform ne gère que le secret qui la porte, au format access_key|secret_key
# lu par les scripts de infra/coolify. Sa valeur est déposée à la main (cf.
# README) : elle n'entre donc pas dans le state. Le secret reste dans le projet
# principal, avec les autres secrets de la plateforme.
resource "scaleway_secret" "coolify_backups_credentials" {
  name        = var.coolify_backups_credentials_secret_name
  description = "Clé Object Storage des backups Coolify (access_key|secret_key). Secret géré par Terraform (infra/platform), valeur déposée à la main."
  tags        = ["tet", "tier:platform", "managed-by:terraform"]
}
