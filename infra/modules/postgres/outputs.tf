output "instance_id" {
  description = "ID Scaleway de l'instance RDB."
  value       = scaleway_rdb_instance.main.id
}

output "endpoint_ip" {
  description = "IP publique du endpoint de l'instance."
  value       = scaleway_rdb_instance.main.endpoint_ip
}

output "endpoint_port" {
  description = "Port d'écoute Postgres."
  value       = scaleway_rdb_instance.main.endpoint_port
}

output "database_name" {
  description = "Nom de la base applicative."
  value       = scaleway_rdb_database.main.name
}

output "admin_user_name" {
  description = "Nom de l'utilisateur admin."
  value       = scaleway_rdb_instance.main.user_name
}

output "admin_password" {
  description = "Mot de passe admin généré. À stocker immédiatement dans Scaleway Secret Manager après le premier apply."
  value       = random_password.admin.result
  sensitive   = true
}

output "connection_uri" {
  description = "URI Postgres complet (sslmode=require). Utiliser pour les variables SUPABASE_DATABASE_URL ou équivalent."
  value       = format(
    "postgres://%s:%s@%s:%d/%s?sslmode=require",
    scaleway_rdb_instance.main.user_name,
    random_password.admin.result,
    scaleway_rdb_instance.main.endpoint_ip,
    scaleway_rdb_instance.main.endpoint_port,
    scaleway_rdb_database.main.name,
  )
  sensitive = true
}

output "certificate" {
  description = "Certificat TLS du serveur, utile pour des modes SSL stricts (verify-full)."
  value       = scaleway_rdb_instance.main.certificate
  sensitive   = true
}
