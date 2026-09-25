# Tier nonprod : un serveur mutualisé portant deux environnements.
#
#   preprod — répétition générale iso-prod : Postgres et Redis managés, comme
#             en production. C'est ce qui permet de détecter avant la prod les
#             bugs liés au fait que l'admin RDB Scaleway n'est pas superuser.
#   staging — intégration continue de main : Postgres et Redis conteneurisés,
#             déployés comme ressources Coolify sur ce même serveur. Rien à
#             provisionner ici pour eux.

module "app_server" {
  source = "../modules/app-server"

  tier                   = "nonprod"
  zone                   = var.scaleway_zone
  instance_type          = var.server_instance_type
  root_volume_size_in_gb = var.server_root_volume_size_in_gb

  private_network_id   = var.private_network_id
  private_ipv4_address = var.server_private_ipv4_address

  # Port 22 fermé sur l'IP publique : l'accès passe par le bastion Coolify.
  ssh_allowed_ips     = []
  ssh_authorized_keys = var.server_ssh_authorized_keys
}

module "postgres" {
  source = "../modules/postgres"

  environment        = "preprod"
  region             = var.scaleway_region
  node_type          = var.pg_node_type
  engine             = "PostgreSQL-15"
  is_ha_cluster      = false
  volume_size_in_gb  = var.pg_volume_size_in_gb
  allowed_ips        = var.pg_allowed_ips
  database_name      = "tet"
  private_network_id = var.private_network_id

  backup_schedule_frequency = 24
  backup_schedule_retention = 7

  # Aligne les timeouts sur la conf Supabase Cloud actuelle :
  # statement_timeout=10min, idle_in_transaction_session_timeout=2min.
  # lock_timeout et idle_session_timeout restent au défaut PG (0).
  #
  # À rejouer en ALTER DATABASE sur le Postgres conteneurisé de staging, sans
  # quoi staging ne reproduit pas le comportement de preprod et de la prod.
  settings = {
    "statement_timeout"                   = "600000"
    "idle_in_transaction_session_timeout" = "120000"
  }
}

# Rôle dédié à GoTrue self-hosted (supabase/auth). Créé via l'API Scaleway
# parce que sur Scaleway PG l'admin (tet_admin) n'est pas superuser et ne peut
# pas accorder CONNECT/CREATE sur la DB via psql — seule l'API, qui agit comme
# _rdb_superadmin côté serveur, le peut. Le bootstrap SQL
# (supabase-api/sql/001-bootstrap-auth-roles.sql) se charge ensuite de la
# création du schéma auth et de l'extension pgcrypto.
resource "random_password" "supabase_auth_admin" {
  length  = 32
  special = true
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
  private_network_id = var.private_network_id
  allowed_ips        = var.redis_allowed_ips
}

# --- DNS ---
#
# Un wildcard par environnement, pointant sur le serveur mutualisé. Coolify
# émet ensuite un certificat par sous-domaine en HTTP-01 : ni DNS-01 ni
# certificat wildcard nécessaires.
#
# Les zones sont créées par infra/platform ; on les référence par nom plutôt
# que par terraform_remote_state, pour garder les stacks découplés.
resource "scaleway_domain_record" "wildcard" {
  for_each = var.dns_enabled ? toset(var.dns_zones) : toset([])

  dns_zone = each.value
  name     = "*"
  type     = "A"
  data     = module.app_server.public_ip
  ttl      = var.dns_ttl
}

# Enregistrement à l'apex de la zone (ex. preprod.territoiresentransitions.fr
# lui-même) : un wildcard ne couvre pas le nom de la zone.
resource "scaleway_domain_record" "apex" {
  for_each = var.dns_enabled ? toset(var.dns_zones) : toset([])

  dns_zone = each.value
  name     = ""
  type     = "A"
  data     = module.app_server.public_ip
  ttl      = var.dns_ttl
}
