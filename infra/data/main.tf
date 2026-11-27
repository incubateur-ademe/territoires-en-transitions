# Tier data : la stack d'analyse, à part des environnements applicatifs.
#
#   serveur    — scripts de calcul des stats, Streamlit, Metabase et le serveur
#                MCP, déployés comme ressources Coolify. Le serveur est enregistré
#                par coolify.tf dans la Team Coolify « TeT - Data »,
#                distincte de la nôtre qui porte la prod : le data analyst y est
#                autonome sans rien voir des autres environnements.
#   postgres   — base de stats managée, reprise de Koyeb par pg_dump | pg_restore
#                lancé depuis ce serveur. Elle vit dans son propre Private
#                Network, sans route vers nonprod ni prod. Les backends
#                applicatifs la lisent par un endpoint public fermé par ACL
#                (pg_public_reader_tiers) : le flux part d'eux, jamais d'ici.
#
# Instance arm64 (BASIC2-*) : les images Docker déployées par Coolify doivent
# exister en linux/arm64 (Metabase, Streamlit et les serveurs MCP usuels oui).

module "app_server" {
  source = "../modules/app-server"

  tier                   = "data"
  zone                   = var.scaleway_zone
  instance_type          = var.server_instance_type
  root_volume_size_in_gb = var.server_root_volume_size_in_gb

  private_network_id   = local.private_network_id
  private_ipv4_address = var.server_private_ipv4_address

  # Port 22 ouvert à la seule instance Coolify de l'incubateur et à la
  # passerelle VPN des opérateurs.
  ssh_allowed_ips     = local.ssh_allowed_ips
  ssh_authorized_keys = var.server_ssh_authorized_keys
}

module "postgres" {
  source = "../modules/postgres"

  environment        = "stats"
  region             = var.scaleway_region
  node_type          = var.pg_node_type
  engine             = "PostgreSQL-17"
  is_ha_cluster      = false
  volume_size_in_gb  = var.pg_volume_size_in_gb
  database_name      = "stats"
  private_network_id = local.private_network_id

  backup_schedule_frequency = 24
  backup_schedule_retention = 7

  # Valeurs posées par Scaleway à la création de l'instance. Les déclarer évite
  # que le plan les remette à null, ce qui peut redémarrer l'instance
  # (max_connections), cf. infra/prod.
  settings = {
    "effective_cache_size"            = "1300"
    "maintenance_work_mem"            = "150"
    "max_connections"                 = "100"
    "max_parallel_workers"            = "0"
    "max_parallel_workers_per_gather" = "0"
    "work_mem"                        = "4"
  }

  public_allowed_cidrs    = local.pg_public_allowed_cidrs
  public_endpoint_enabled = var.pg_public_endpoint_enabled
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

# Rôle des backends applicatifs (ANALYTICS_DATABASE_URL, par l'endpoint
# public) : lecture seule, à part de mcp_reader, qui vit dans la Team Coolify
# du data analyst. Chacun se renouvelle sans couper l'autre, et
# pg_stat_activity dit qui lit.
resource "random_password" "backend_reader" {
  length           = 32
  special          = true
  override_special = "-_.!*~"
  min_lower        = 1
  min_upper        = 1
  min_numeric      = 1
  min_special      = 1
}

resource "scaleway_rdb_user" "backend_reader" {
  instance_id = module.postgres.instance_id
  name        = "backend_reader"
  password    = random_password.backend_reader.result
  is_admin    = false
}

resource "scaleway_rdb_privilege" "backend_reader" {
  instance_id   = module.postgres.instance_id
  database_name = module.postgres.database_name
  user_name     = scaleway_rdb_user.backend_reader.name
  permission    = "readonly"
}

# Rôle des scripts de calcul et de Streamlit : lecture/écriture sur la base
# de stats, sans les droits admin de l'instance. L'admin reste réservé aux
# opérateurs et à la migration depuis Koyeb.
resource "random_password" "stats_writer" {
  length           = 32
  special          = true
  override_special = "-_.!*~"
  min_lower        = 1
  min_upper        = 1
  min_numeric      = 1
  min_special      = 1
}

resource "scaleway_rdb_user" "stats_writer" {
  instance_id = module.postgres.instance_id
  name        = "stats_writer"
  password    = random_password.stats_writer.result
  is_admin    = false
}

resource "scaleway_rdb_privilege" "stats_writer" {
  instance_id   = module.postgres.instance_id
  database_name = module.postgres.database_name
  user_name     = scaleway_rdb_user.stats_writer.name
  permission    = "readwrite"
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
