terraform {
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
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
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

resource "scaleway_rdb_acl" "main" {
  instance_id = scaleway_rdb_instance.main.id

  dynamic "acl_rules" {
    for_each = var.allowed_ips
    content {
      ip          = acl_rules.key
      description = acl_rules.value
    }
  }
}
