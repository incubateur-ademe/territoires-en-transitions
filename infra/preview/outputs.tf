output "server_id" {
  description = "ID Scaleway du serveur preview."
  value       = module.app_server.server_id
}

output "server_name" {
  description = "Nom du serveur preview. Clé d'idempotence côté Coolify."
  value       = module.app_server.server_name
}

output "server_public_ip" {
  description = "IP publique du serveur preview. Cible du wildcard DNS."
  value       = module.app_server.public_ip
}

output "server_private_ip" {
  description = "IP privée du serveur preview. Adresse SSH enregistrée dans Coolify."
  value       = module.app_server.private_ip
}

output "server_ssh_key_secret_name" {
  description = "Nom du secret Secret Manager contenant la clé privée SSH root du serveur. Consommé par le stack infra/coolify."
  value       = module.app_server.ssh_key_secret_name
}
