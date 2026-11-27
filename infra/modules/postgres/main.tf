terraform {
  required_version = ">= 1.10.0"

  required_providers {
    scaleway = {
      source  = "scaleway/scaleway"
      version = "~> 2.50"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

resource "random_password" "admin" {
  length  = 32
  special = true
  # Set restreint aux caractères URL-safe : ce mot de passe est injecté tel quel
  # dans des connection strings (postgres://user:PASSWORD@host/db, rediss://...).
  # L'ancien set contenait #, ? et % qui y sont structurants — # ouvre un
  # fragment, ? une query, % une percent-escape invalide — et cassaient
  # silencieusement les URI produites par les outputs *_connection_uri.
  override_special = "-_.!*~"
  # Scaleway exige au moins un caractère de chaque classe.
  min_lower   = 1
  min_upper   = 1
  min_numeric = 1
  min_special = 1
}

resource "scaleway_rdb_instance" "main" {
  name      = "tet-${var.environment}-pg"
  node_type = var.node_type
  engine    = var.engine
  region    = var.region

  is_ha_cluster = var.is_ha_cluster

  volume_type       = var.volume_type
  volume_size_in_gb = var.volume_size_in_gb

  disable_backup            = false
  backup_schedule_frequency = var.backup_schedule_frequency
  backup_schedule_retention = var.backup_schedule_retention
  backup_same_region        = var.backup_same_region

  user_name = var.admin_user_name
  password  = random_password.admin.result

  settings = var.settings

  # Réseau privé d'abord : les conteneurs y sont, les opérateurs y arrivent
  # par le VPN. Retirer ce bloc ne supprime pas un endpoint existant : le
  # supprimer à la main (scw rdb endpoint delete).
  private_network {
    pn_id       = var.private_network_id
    enable_ipam = true
  }

  # Endpoint public seulement si des CIDR sont autorisés (cf. scaleway_rdb_acl
  # plus bas) : sans ACL, Scaleway l'ouvrirait à 0.0.0.0/0.
  dynamic "load_balancer" {
    for_each = length(var.public_allowed_cidrs) > 0 ? [1] : []
    content {}
  }

  tags = concat(
    [
      "tet",
      "env:${var.environment}",
      "managed-by:terraform",
    ],
    var.tags,
  )

  lifecycle {
    prevent_destroy = true
  }
}

resource "scaleway_rdb_database" "main" {
  instance_id = scaleway_rdb_instance.main.id
  name        = var.database_name
}

resource "scaleway_rdb_privilege" "admin" {
  instance_id   = scaleway_rdb_instance.main.id
  database_name = scaleway_rdb_database.main.name
  user_name     = scaleway_rdb_instance.main.user_name
  permission    = "all"
}


# ACL de l'endpoint public : elle ne filtre que lui, pas le Private Network.
# Scaleway pose 0.0.0.0/0 par défaut à la création de l'endpoint, cette
# ressource le remplace dans le même apply : vérifier ensuite avec
# `scw rdb acl list instance-id=<id>`.
resource "scaleway_rdb_acl" "public" {
  count = length(var.public_allowed_cidrs) > 0 ? 1 : 0

  instance_id = scaleway_rdb_instance.main.id

  dynamic "acl_rules" {
    for_each = var.public_allowed_cidrs
    content {
      ip          = acl_rules.value
      description = acl_rules.key
    }
  }
}
