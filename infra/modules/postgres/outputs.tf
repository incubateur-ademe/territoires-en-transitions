output "instance_id" {
  description = "ID Scaleway de l'instance RDB."
  value       = scaleway_rdb_instance.main.id
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

output "private_endpoint_ip" {
  description = "IP privée de l'instance RDB dans le Private Network."
  value       = scaleway_rdb_instance.main.private_network[0].ip
}

output "private_endpoint_port" {
  description = "Port Postgres sur l'endpoint privé."
  value       = scaleway_rdb_instance.main.private_network[0].port
}

output "private_connection_uri" {
  description = "URI Postgres via le réseau privé. C'est cette URI que les conteneurs Coolify doivent utiliser."
  value = format(
    "postgres://%s:%s@%s:%d/%s?sslmode=require",
    scaleway_rdb_instance.main.user_name,
    random_password.admin.result,
    scaleway_rdb_instance.main.private_network[0].ip,
    scaleway_rdb_instance.main.private_network[0].port,
    scaleway_rdb_database.main.name,
  )
  sensitive = true
}

output "certificate" {
  description = "Certificat TLS du serveur, utile pour des modes SSL stricts (verify-full)."
  value       = scaleway_rdb_instance.main.certificate
  sensitive   = true
}
