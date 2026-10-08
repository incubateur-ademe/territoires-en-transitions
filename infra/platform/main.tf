# Socle transverse : réseau, control plane Coolify, zones DNS et stockage.
# Rien ici n'appartient à un environnement applicatif — les stacks nonprod et
# preview viennent s'y brancher.
#
# La prod est à part : projet Scaleway dédié (créé par un admin), VPC propre (créé par
# infra/prod), aucun lien réseau avec le VPC partagé. Coolify la pilote en SSH
# sur son IP publique, ouverte à la seule IP publique du control plane.

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
      # Plage explicite : bornes inclusives, 0-0 ne vise que le port 0 et
      # droppe le SYN, émis depuis un port éphémère.
      src_port_low  = 0
      src_port_high = 65535
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
      # Plage éphémère Linux (ip_local_port_range) : seuls ports où reviennent
      # les réponses SSH. Plus large, un serveur compromis émettant depuis le
      # port 22 atteindrait n'importe quel service privé du control plane.
      dst_port_low  = 32768
      dst_port_high = 60999
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
  source = "../modules/coolify"

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

# --- Projet de production ---
#
# La prod vit dans son propre projet Scaleway (var.prod_project_id), où
# infra/prod crée son VPC et ses ressources. Le projet est créé par un admin de
# l'organisation : créer un projet exige des droits d'organisation que les
# credentials Terraform n'ont pas. Ce stack ne fait que relayer son ID.

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

# --- Stockage des backups ---
#
# Bucket cible de tous les backups Coolify : bases des applications (via le S3
# storage Coolify) et instance Coolify elle-même (infra/coolify,
# terraform_data.instance_backup).
#
# Projet Scaleway dédié (var.backups_project_id) : les permissions IAM Object
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
  project_id = var.backups_project_id

  object_lock_enabled = true

  versioning {
    enabled = true
  }

  # Rétention des backups de l'instance Coolify. Ceux-là ne passent pas par
  # Coolify, qui ne peut donc pas les purger lui-même. Limitée au préfixe : les
  # backups des applications gardent la rétention configurée dans Coolify.
  lifecycle_rule {
    id      = "coolify-instance-retention"
    prefix  = "${var.coolify_instance_backup_prefix}/"
    enabled = true

    expiration {
      days = var.coolify_instance_backup_retention_days
    }
  }

  # Sans cette règle, le versioning garde indéfiniment chaque backup supprimé
  # (par Coolify ou par la règle ci-dessus) : le stockage grossit sans limite.
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
  project_id = var.backups_project_id

  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = var.backups_lock_days
    }
  }
}

# Clé dédiée aux backups, utilisée par le S3 storage Coolify et par le backup
# de l'instance. L'application IAM, sa politique (objets du projet backups
# uniquement, sans droit sur le cycle de vie, le verrou ni la politique du
# bucket) et sa clé sont créées par l'admin de l'organisation.
#
# Terraform ne gère que le secret qui la porte, au format access_key|secret_key
# lu par les scripts de infra/coolify. Sa valeur est déposée à la main (cf.
# README) : elle n'entre donc pas dans le state. Le secret reste dans le projet
# principal, avec les autres secrets du control plane.
resource "scaleway_secret" "coolify_backups_credentials" {
  name        = var.coolify_backups_credentials_secret_name
  description = "Clé Object Storage des backups Coolify (access_key|secret_key). Secret géré par Terraform (infra/platform), valeur déposée à la main."
  tags        = ["tet", "tier:platform", "managed-by:terraform"]
}
