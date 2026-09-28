# Socle transverse : réseau, control plane Coolify, zones DNS et stockage.
# Rien ici n'appartient à un environnement applicatif — les stacks nonprod et
# preview viennent s'y brancher.
#
# La prod est à part : projet Scaleway dédié (créé ici), VPC propre (créé par
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

# --- Projet de production ---
#
# Un projet par frontière de confiance : prod n'est joignable ni par le réseau
# ni, à terme, par les droits IAM des autres environnements. Les ressources
# prod sont créées par infra/prod dans ce projet ; seul le projet vit ici, pour
# que platform puisse en publier l'ID sans dépendre de prod.
resource "scaleway_account_project" "prod" {
  name        = var.prod_project_name
  description = "Production TET. VPC isolé, piloté par Coolify en SSH public filtré. Géré par Terraform (infra/platform)."

  lifecycle {
    prevent_destroy = true
  }
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

# --- Stockage des backups ---
#
# Bucket cible de tous les backups Coolify : bases des applications (via le S3
# storage Coolify) et instance Coolify elle-même (infra/coolify,
# terraform_data.instance_backup).
#
# Projet Scaleway dédié : les permissions IAM Object Storage valent pour un
# projet entier, pas pour un bucket. Dans le projet principal, la clé des
# backups pourrait aussi lire tet-tfstate, qui contient les mots de passe et les
# clés SSH. Ici, elle ne voit que ce bucket.
resource "scaleway_account_project" "backups" {
  name        = var.backups_project_name
  description = "Backups TET (Coolify). Isolé du projet principal : la clé IAM des backups n'a accès qu'à ce projet. Géré par Terraform (infra/platform)."
}

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
  project_id = scaleway_account_project.backups.id

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
  project_id = scaleway_account_project.backups.id

  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = var.backups_lock_days
    }
  }
}

# Clé dédiée aux backups, utilisée par le S3 storage Coolify et par le backup
# de l'instance. Pas de BucketsWrite : elle ne peut modifier ni le cycle de vie,
# ni le verrou, ni la politique du bucket.
resource "scaleway_iam_application" "coolify_backups" {
  name        = "tet-coolify-backups"
  description = "Écriture des backups Coolify dans le projet ${var.backups_project_name}. Géré par Terraform (infra/platform)."
}

resource "scaleway_iam_policy" "coolify_backups" {
  name           = "tet-coolify-backups"
  description    = "Objets du projet ${var.backups_project_name} uniquement. Géré par Terraform (infra/platform)."
  application_id = scaleway_iam_application.coolify_backups.id

  rule {
    project_ids = [scaleway_account_project.backups.id]
    permission_set_names = [
      "ObjectStorageBucketsRead",
      "ObjectStorageObjectsRead",
      "ObjectStorageObjectsWrite",
      # Pour la rétention de Coolify. Le verrou COMPLIANCE empêche toujours la
      # suppression d'une version avant l'échéance.
      "ObjectStorageObjectsDelete",
    ]
  }
}

# default_project_id : l'API S3 de Scaleway résout les buckets dans le projet
# par défaut de la clé.
resource "scaleway_iam_api_key" "coolify_backups" {
  application_id     = scaleway_iam_application.coolify_backups.id
  default_project_id = scaleway_account_project.backups.id
  description        = "S3 storage Coolify + backup de l'instance. Géré par Terraform (infra/platform)."
}

# Les scripts de infra/coolify lisent la clé ici, au format access_key|secret_key.
# Le secret reste dans le projet principal, avec les autres secrets du control
# plane : la clé des backups n'a aucun droit dessus.
resource "scaleway_secret" "coolify_backups_credentials" {
  name        = var.coolify_backups_credentials_secret_name
  description = "Clé Object Storage des backups Coolify (access_key|secret_key). Gérée par Terraform (infra/platform)."
  tags        = ["tet", "tier:platform", "managed-by:terraform"]
}

resource "scaleway_secret_version" "coolify_backups_credentials" {
  secret_id = scaleway_secret.coolify_backups_credentials.id
  data      = "${scaleway_iam_api_key.coolify_backups.access_key}|${scaleway_iam_api_key.coolify_backups.secret_key}"
}
