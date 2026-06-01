output "pg_instance_id" {
  description = "ID Scaleway de l'instance RDB preprod."
  value       = module.postgres.instance_id
}

output "pg_endpoint_ip" {
  description = "IP du endpoint Postgres preprod."
  value       = module.postgres.endpoint_ip
}

output "pg_endpoint_port" {
  description = "Port Postgres preprod."
  value       = module.postgres.endpoint_port
}

output "pg_admin_user" {
  description = "Nom de l'utilisateur admin Postgres preprod."
  value       = module.postgres.admin_user_name
}

output "pg_admin_password" {
  description = "Mot de passe admin généré. À récupérer immédiatement après le premier apply via : terraform output -raw pg_admin_password — puis stocker dans Scaleway Secret Manager."
  value       = module.postgres.admin_password
  sensitive   = true
}

output "pg_connection_uri" {
  description = "URI Postgres complet (sslmode=require). Sert à alimenter SUPABASE_DATABASE_URL_PREPROD une fois la bascule effective."
  value       = module.postgres.connection_uri
  sensitive   = true
}
