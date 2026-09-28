# --- Serveur ---

output "server_id" {
  description = "ID Scaleway du serveur de production."
  value       = module.app_server.server_id
}

output "server_name" {
  description = "Nom du serveur de production. Clé d'idempotence côté Coolify."
  value       = module.app_server.server_name
}

output "server_public_ip" {
  description = "IP publique du serveur de production. Cible des enregistrements DNS de production."
  value       = module.app_server.public_ip
}

output "server_private_ip" {
  description = "IP privée du serveur de production, dans le VPC prod. Injoignable depuis Coolify : ne pas l'enregistrer comme adresse SSH."
  value       = module.app_server.private_ip
}

output "server_ssh_host" {
  description = "Adresse SSH du serveur de production pour Coolify : son IP publique, ouverte à la seule IP du control plane. Valeur ssh_host de app_servers.prod dans infra/coolify."
  value       = module.app_server.public_ip
}

output "vpc_id" {
  description = "ID du VPC prod."
  value       = module.network.vpc_id
}

output "server_ssh_key_secret_name" {
  description = "Nom du secret Secret Manager contenant la clé privée SSH root du serveur. Consommé par le stack infra/coolify."
  value       = module.app_server.ssh_key_secret_name
}

# --- Postgres (prod) ---

output "pg_instance_id" {
  description = "ID Scaleway de l'instance RDB prod."
  value       = module.postgres.instance_id
}

output "pg_endpoint_ip" {
  description = "IP publique de l'endpoint Postgres de production (migration et accès opérateur)."
  value       = module.postgres.endpoint_ip
}

output "pg_endpoint_port" {
  description = "Port Postgres de production sur l'endpoint public."
  value       = module.postgres.endpoint_port
}

output "pg_private_endpoint_ip" {
  description = "IP privée du Postgres de production dans le VPC. C'est cette IP que les conteneurs doivent utiliser."
  value       = module.postgres.private_endpoint_ip
}

output "pg_admin_user" {
  description = "Nom de l'utilisateur admin Postgres de production."
  value       = module.postgres.admin_user_name
}

output "pg_admin_password" {
  description = "Mot de passe admin généré. À récupérer après le premier apply (terraform output -raw pg_admin_password) et à stocker dans Secret Manager."
  value       = module.postgres.admin_password
  sensitive   = true
}

output "pg_database_name" {
  description = "Nom de la base de données applicative."
  value       = module.postgres.database_name
}

output "pg_connection_uri" {
  description = "URI Postgres publique (sslmode=require). Pour la migration initiale ; les apps utilisent pg_private_connection_uri."
  value       = module.postgres.connection_uri
  sensitive   = true
}

output "pg_private_connection_uri" {
  description = "URI Postgres via le réseau privé. À injecter dans les variables d'environnement des conteneurs de production."
  value       = module.postgres.private_connection_uri
  sensitive   = true
}

output "supabase_auth_admin_password" {
  description = "Mot de passe du rôle supabase_auth_admin. À injecter dans GOTRUE_DB_DATABASE_URL. Lu par le Makefile bootstrap-supabase-auth-roles-sql."
  value       = random_password.supabase_auth_admin.result
  sensitive   = true
}

# --- Redis (prod) ---

output "redis_cluster_id" {
  description = "ID Scaleway du cluster Redis de production."
  value       = module.redis.cluster_id
}

output "redis_private_ip" {
  description = "IP privée du cluster Redis dans le VPC. À utiliser comme QUEUE_REDIS_HOST dans les conteneurs de production."
  value       = module.redis.private_ip
}

output "redis_admin_user" {
  description = "Nom de l'utilisateur admin Redis de production."
  value       = module.redis.admin_user_name
}

output "redis_admin_password" {
  description = "Mot de passe admin Redis. À récupérer via terraform output -raw redis_admin_password."
  value       = module.redis.admin_password
  sensitive   = true
}

output "redis_private_connection_uri" {
  description = "URI Redis via le réseau privé (TLS)."
  value       = module.redis.private_connection_uri
  sensitive   = true
}
