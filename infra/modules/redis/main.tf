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
