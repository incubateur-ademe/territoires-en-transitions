# Tier data : la stack d'analyse, à part des environnements applicatifs.
#
#   serveur    — scripts de calcul des stats, Streamlit, Metabase et le serveur
#                MCP, déployés comme ressources Coolify. Le data analyst y est
#                autonome via l'UI Coolify : rien à déclarer ici par application.
#   postgres   — base de stats managée (ex-Koyeb), pour les backups automatiques.
#                Elle reçoit aussi une copie des données staging : elle vit dans
#                son propre Private Network, sans route vers nonprod ni prod.
#
# Instance arm64 (BASIC2-*) : les images Docker déployées par Coolify doivent
# exister en linux/arm64 (Metabase, Streamlit et les serveurs MCP usuels oui).

module "app_server" {
  source = "../modules/app-server"

  tier                   = "data"
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

  environment        = "stats"
  region             = var.scaleway_region
  node_type          = var.pg_node_type
  engine             = "PostgreSQL-15"
  is_ha_cluster      = false
  volume_size_in_gb  = var.pg_volume_size_in_gb
  allowed_ips        = var.pg_allowed_ips
  database_name      = "stats"
  private_network_id = var.private_network_id

  backup_schedule_frequency = 24
  backup_schedule_retention = 7
}

# Mots de passe restreints aux caractères URL-safe : injectables tels quels
# dans une connection string, sans percent-encoding (cf. infra/nonprod).
resource "random_password" "mcp_reader" {
  length           = 32
  special          = true
  override_special = "-_.!*~"
  min_lower        = 1
  min_upper        = 1
  min_numeric      = 1
  min_special      = 1
}

# Rôle du serveur MCP : lecture seule sur la base de stats. C'est le seul rôle
# que le MCP connaît ; l'authentification des personnes et le TLS sont portés
# par le serveur MCP lui-même (ressource Coolify).
resource "scaleway_rdb_user" "mcp_reader" {
  instance_id = module.postgres.instance_id
  name        = "mcp_reader"
  password    = random_password.mcp_reader.result
  is_admin    = false
}

resource "scaleway_rdb_privilege" "mcp_reader" {
  instance_id   = module.postgres.instance_id
  database_name = module.postgres.database_name
  user_name     = scaleway_rdb_user.mcp_reader.name
  permission    = "readonly"
}

# Base applicative de Metabase (ses dashboards, utilisateurs, requêtes
# sauvegardées), sur la même instance : sauvegardée avec le reste.
resource "scaleway_rdb_database" "metabase" {
  instance_id = module.postgres.instance_id
  name        = "metabase"
}

resource "random_password" "metabase" {
  length           = 32
  special          = true
  override_special = "-_.!*~"
  min_lower        = 1
  min_upper        = 1
  min_numeric      = 1
  min_special      = 1
}

resource "scaleway_rdb_user" "metabase" {
  instance_id = module.postgres.instance_id
  name        = "metabase"
  password    = random_password.metabase.result
  is_admin    = false
}

resource "scaleway_rdb_privilege" "metabase" {
  instance_id   = module.postgres.instance_id
  database_name = scaleway_rdb_database.metabase.name
  user_name     = scaleway_rdb_user.metabase.name
  permission    = "all"
}
