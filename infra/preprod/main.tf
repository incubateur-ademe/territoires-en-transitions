module "vpc" {
  source = "../modules/vpc"

  environment = "preprod"
  region      = var.scaleway_region
  ipv4_subnet = var.vpc_ipv4_subnet
}

module "postgres" {
  source = "../modules/postgres"

  environment       = "preprod"
  region            = var.scaleway_region
  node_type         = var.pg_node_type
  engine            = "PostgreSQL-15"
  is_ha_cluster     = false
  volume_size_in_gb = var.pg_volume_size_in_gb
  allowed_ips       = var.pg_allowed_ips
  database_name     = "tet"
  private_network_id = module.vpc.private_network_id

  backup_schedule_frequency = 24
  backup_schedule_retention = 7
}

# Rôle dédié à GoTrue self-hosted (supabase/auth). Créé via l'API Scaleway
# parce que sur Scaleway PG l'admin (tet_admin) n'est pas superuser et ne peut
# pas accorder CONNECT/CREATE sur la DB via psql — seule l'API, qui agit comme
# _rdb_superadmin côté serveur, le peut. Le bootstrap SQL (sql/001-bootstrap-roles.sql)
# se charge ensuite de la création du schéma auth et de l'extension pgcrypto.
resource "random_password" "supabase_auth_admin" {
  length           = 32
  special          = true
  # Set restreint aux caractères URL-safe (unreserved + sub-delims sans
  # ambiguïté) pour que le password puisse être injecté tel quel dans
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

  environment        = "preprod"
  zone               = var.scaleway_zone
  node_type          = var.redis_node_type
  cluster_size       = 1
  private_network_id = module.vpc.private_network_id
  allowed_ips        = var.redis_allowed_ips
}

module "coolify" {
  source = "../modules/coolify"

  environment        = "preprod"
  zone               = var.scaleway_zone
  instance_type      = var.coolify_instance_type
  private_network_id = module.vpc.private_network_id
  ssh_allowed_ips    = var.coolify_ssh_allowed_ips
  ssh_authorized_keys = var.coolify_ssh_authorized_keys
}
