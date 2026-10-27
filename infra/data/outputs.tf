# --- Serveur ---

output "server_id" {
  description = "ID Scaleway du serveur data."
  value       = module.app_server.server_id
}

output "server_name" {
  description = "Nom du serveur data. Clé d'idempotence côté Coolify."
  value       = module.app_server.server_name
}

output "server_public_ip" {
  description = "IP publique du serveur data. Cible des enregistrements DNS de Streamlit, Metabase et du MCP."
  value       = module.app_server.public_ip
}

output "server_private_ip" {
  description = "IP privée du serveur data. Adresse SSH enregistrée dans Coolify."
  value       = module.app_server.private_ip
}

output "server_ssh_key_secret_name" {
  description = "Nom du secret Secret Manager contenant la clé privée SSH root du serveur. Consommé par le stack infra/coolify."
  value       = module.app_server.ssh_key_secret_name
}

output "server_sshd_host_public_key" {
  description = "Clé d'hôte SSH du serveur, imposée par Terraform. Valeur sshd_host_public_key de app_servers.data dans infra/coolify."
  value       = module.app_server.sshd_host_public_key
}

# --- Postgres (stats) ---

output "pg_instance_id" {
  description = "ID Scaleway de l'instance RDB stats."
  value       = module.postgres.instance_id
}

output "pg_endpoint_ip" {
  description = "IP publique de l'endpoint Postgres stats (migration depuis Koyeb et accès opérateur)."
  value       = module.postgres.endpoint_ip
}

output "pg_endpoint_port" {
  description = "Port Postgres stats sur l'endpoint public."
  value       = module.postgres.endpoint_port
}

output "pg_private_endpoint_ip" {
  description = "IP privée du Postgres stats dans le VPC. C'est cette IP que les conteneurs doivent utiliser."
  value       = module.postgres.private_endpoint_ip
}

output "pg_admin_user" {
  description = "Nom de l'utilisateur admin Postgres stats."
  value       = module.postgres.admin_user_name
}

output "pg_admin_password" {
  description = "Mot de passe admin généré (terraform output -raw pg_admin_password)."
  value       = module.postgres.admin_password
  sensitive   = true
}

output "pg_connection_uri" {
  description = "URI Postgres publique (sslmode=require). Pour la migration depuis Koyeb et les scripts lancés depuis un poste."
  value       = module.postgres.connection_uri
  sensitive   = true
}

output "pg_private_connection_uri" {
  description = "URI Postgres admin via le réseau privé. Pour les scripts de calcul et Streamlit (conteneurs Coolify)."
  value       = module.postgres.private_connection_uri
  sensitive   = true
}

output "pg_tls_ca" {
  description = "Certificat auto-signé de la RDB stats, pour vérifier le TLS depuis les conteneurs."
  value       = module.postgres.certificate
}

output "mcp_reader_private_connection_uri" {
  description = "URI Postgres du rôle mcp_reader (lecture seule) via le réseau privé. À injecter dans le serveur MCP."
  value = format("postgres://%s:%s@%s:%d/%s?sslmode=require",
    scaleway_rdb_user.mcp_reader.name, random_password.mcp_reader.result,
  module.postgres.private_endpoint_ip, module.postgres.private_endpoint_port, module.postgres.database_name)
  sensitive = true
}

output "metabase_private_connection_uri" {
  description = "URI Postgres de la base applicative Metabase via le réseau privé. À injecter dans MB_DB_CONNECTION_URI."
  value = format("postgres://%s:%s@%s:%d/%s?sslmode=require",
    scaleway_rdb_user.metabase.name, random_password.metabase.result,
  module.postgres.private_endpoint_ip, module.postgres.private_endpoint_port, scaleway_rdb_database.metabase.name)
  sensitive = true
}
