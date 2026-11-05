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

locals {
  public_endpoint = length(var.allowed_ips) > 0
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

  # Endpoint public (load balancer Scaleway), créé seulement si des IP y sont
  # autorisées. Une instance RDB sans règle d'ACL accepte 0.0.0.0/0 : ne jamais
  # exposer l'endpoint public sans ACL. Le bloc doit être explicite dès qu'un
  # private_network est déclaré, sinon Scaleway ne crée pas l'endpoint public.
  # Vider allowed_ips supprime l'endpoint public (fin de migration).
  dynamic "load_balancer" {
    for_each = local.public_endpoint ? [1] : []
    content {}
  }

  dynamic "private_network" {
    for_each = var.private_network_id != null ? [1] : []
    content {
      pn_id       = var.private_network_id
      enable_ipam = true
    }
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

    precondition {
      condition     = local.public_endpoint || var.private_network_id != null
      error_message = "L'instance n'aurait aucun endpoint : renseigner private_network_id ou allowed_ips."
    }
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

# Le provider exige au moins une règle : pas de ressource ACL sans endpoint public.
resource "scaleway_rdb_acl" "main" {
  count = local.public_endpoint ? 1 : 0

  instance_id = scaleway_rdb_instance.main.id

  dynamic "acl_rules" {
    for_each = var.allowed_ips
    content {
      ip          = acl_rules.key
      description = acl_rules.value
    }
  }
}

moved {
  from = scaleway_rdb_acl.main
  to   = scaleway_rdb_acl.main[0]
}
