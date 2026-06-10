# VPC

output "vpc_id" {
  description = "ID du VPC preprod."
  value       = module.vpc.vpc_id
}

output "private_network_id" {
  description = "ID du Private Network preprod. Référencer pour attacher d'autres ressources (Redis, etc.)."
  value       = module.vpc.private_network_id
}

# Postgres

output "pg_instance_id" {
  description = "ID Scaleway de l'instance RDB preprod."
  value       = module.postgres.instance_id
}

output "pg_endpoint_ip" {
  description = "IP publique du endpoint Postgres preprod (pour la migration depuis Supabase Cloud et l'accès opérateur)."
  value       = module.postgres.endpoint_ip
}

output "pg_endpoint_port" {
  description = "Port Postgres preprod."
  value       = module.postgres.endpoint_port
}

output "pg_private_endpoint_ip" {
  description = "IP privée du endpoint Postgres dans le VPC. C'est cette IP que les conteneurs Coolify doivent utiliser."
  value       = module.postgres.private_endpoint_ip
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
  description = "URI Postgres publique (sslmode=require). Pour la migration initiale depuis Supabase Cloud. Après bascule, les apps utilisent pg_private_connection_uri."
  value       = module.postgres.connection_uri
  sensitive   = true
}

output "pg_private_connection_uri" {
  description = "URI Postgres via le réseau privé. À injecter dans les variables d'environnement des conteneurs Coolify (SUPABASE_DATABASE_URL ou équivalent)."
  value       = module.postgres.private_connection_uri
  sensitive   = true
}

# Coolify

output "coolify_server_id" {
  description = "ID Scaleway de la VM Coolify preprod."
  value       = module.coolify.server_id
}

output "coolify_public_ip" {
  description = "IP publique de la VM Coolify preprod. À ajouter dans pg_allowed_ips après le premier apply."
  value       = module.coolify.public_ip
}
