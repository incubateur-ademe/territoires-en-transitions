# Tier prod : serveur dédié, Postgres et Redis managés.
#
# Projet Scaleway dédié (créé par infra/platform) et VPC propre, sans lien
# réseau avec le VPC partagé : nonprod et preview n'ont aucune route vers la
# prod. Coolify pilote le serveur en SSH sur son IP publique, que le security
# group n'ouvre qu'à l'IP publique du control plane.

module "network" {
  source = "../modules/network"

  region   = var.scaleway_region
  vpc_name = "tet-prod"

  private_networks = {
    prod = { ipv4_subnet = var.private_network_ipv4_subnet }
  }

  # Un seul PN : aucun trafic routé entre PN à filtrer aujourd'hui. Les ACL
  # (IPv4 et IPv6, drop par défaut) restent en place pour qu'un PN ajouté plus
  # tard soit isolé d'office.
  acl_default_policy = "drop"
}

locals {
  private_network_id = module.network.private_network_ids["prod"]
}

module "app_server" {
  source = "../modules/app-server"

  tier                   = "prod"
  zone                   = var.scaleway_zone
  instance_type          = var.server_instance_type
  root_volume_size_in_gb = var.server_root_volume_size_in_gb

  private_network_id   = local.private_network_id
  private_ipv4_address = var.server_private_ipv4_address

  # Port 22 ouvert à la seule IP publique du control plane : c'est par là que
  # Coolify pilote ce serveur, et que les opérateurs rebondissent (ssh -J).
  ssh_allowed_ips     = ["${var.coolify_public_ip}/32"]
  ssh_authorized_keys = var.server_ssh_authorized_keys
}

module "postgres" {
  source = "../modules/postgres"

  environment        = "prod"
  region             = var.scaleway_region
  node_type          = var.pg_node_type
  engine             = "PostgreSQL-15"
  is_ha_cluster      = var.pg_is_ha_cluster
  volume_size_in_gb  = var.pg_volume_size_in_gb
  allowed_ips        = var.pg_allowed_ips
  database_name      = "tet"
  private_network_id = local.private_network_id

  backup_schedule_frequency = var.pg_backup_schedule_frequency
  backup_schedule_retention = var.pg_backup_schedule_retention

  # Mêmes timeouts qu'en preprod : c'est la conf que preprod a pour mission de
  # valider avant d'arriver ici.
  settings = {
    "statement_timeout"                   = "600000"
    "idle_in_transaction_session_timeout" = "120000"
  }
}

# Rôle dédié à GoTrue self-hosted (supabase/auth). Créé via l'API Scaleway
# parce que sur Scaleway PG l'admin (tet_admin) n'est pas superuser et ne peut
# pas accorder CONNECT/CREATE sur la DB via psql.
resource "random_password" "supabase_auth_admin" {
  length  = 32
  special = true
  # Set restreint aux caractères URL-safe, pour injection directe dans
  # DATABASE_URL sans percent-encoding.
  override_special = "-_.!*~"
  # Scaleway exige au moins un de chaque classe.
  min_lower   = 1
  min_upper   = 1
  min_numeric = 1
  min_special = 1
}

resource "scaleway_rdb_user" "supabase_auth_admin" {
  instance_id = module.postgres.instance_id
  name        = "supabase_auth_admin"
  password    = random_password.supabase_auth_admin.result
  is_admin    = false
}

resource "scaleway_rdb_privilege" "supabase_auth_admin" {
  instance_id   = module.postgres.instance_id
  database_name = module.postgres.database_name
  user_name     = scaleway_rdb_user.supabase_auth_admin.name
  permission    = "all"
}

module "redis" {
  source = "../modules/redis"

  environment        = "prod"
  zone               = var.scaleway_zone
  node_type          = var.redis_node_type
  cluster_size       = var.redis_cluster_size
  private_network_id = local.private_network_id
  allowed_ips        = var.redis_allowed_ips
}

# --- DNS ---
#
# Par défaut aucun enregistrement n'est géré ici : l'apex
# territoiresentransitions.fr et les noms de production restent chez le
# registrar actuel (décision explicite).
#
# Pour basculer la prod sous Terraform plus tard, il suffira d'enregistrer les
# zones concernées dans infra/platform puis de renseigner dns_zones ici.
resource "scaleway_domain_record" "wildcard" {
  for_each = var.dns_enabled ? toset(var.dns_zones) : toset([])

  dns_zone = each.value
  name     = "*"
  type     = "A"
  data     = module.app_server.public_ip
  ttl      = var.dns_ttl
}

resource "scaleway_domain_record" "apex" {
  for_each = var.dns_enabled ? toset(var.dns_zones) : toset([])

  dns_zone = each.value
  name     = ""
  type     = "A"
  data     = module.app_server.public_ip
  ttl      = var.dns_ttl
}
