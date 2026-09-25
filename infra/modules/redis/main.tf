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

resource "scaleway_redis_cluster" "main" {
  name    = "tet-${var.environment}-redis"
  version = var.redis_version
  zone    = var.zone

  node_type    = var.node_type
  cluster_size = var.cluster_size
  tls_enabled  = true

  user_name = var.admin_user_name
  password  = random_password.admin.result

  # Endpoint public avec ACL. Si allowed_ips est vide, aucune règle n'est créée
  # et le cluster reste accessible uniquement via le réseau privé.
  dynamic "acl" {
    for_each = var.allowed_ips
    content {
      ip          = acl.key
      description = acl.value
    }
  }

  dynamic "private_network" {
    for_each = var.private_network_id != null ? [1] : []
    content {
      id = var.private_network_id
      # service_ips omis → IPAM Scaleway auto-assigne depuis le subnet du VPC
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
  }
}
