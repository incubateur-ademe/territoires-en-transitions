output "server_id" {
  description = "ID Scaleway du serveur."
  value       = scaleway_instance_server.server.id
}

output "server_name" {
  description = "Nom du serveur. Sert de clé d'idempotence côté Coolify (GET /servers by name)."
  value       = local.server_name
}

output "public_ip" {
  description = "IP publique réservée du serveur. Cible des enregistrements DNS."
  value       = scaleway_instance_ip.server.address
}

output "private_ip" {
  description = "IP privée fixe du serveur. C'est l'adresse à enregistrer dans Coolify comme cible SSH."
  value       = scaleway_ipam_ip.server.address
}

output "ssh_public_key" {
  description = "Clé publique SSH autorisée sur root. Informative : déjà injectée par cloud-init."
  value       = trimspace(tls_private_key.server.public_key_openssh)
}

output "ssh_key_secret_name" {
  description = "Nom du secret Secret Manager contenant la clé privée SSH root. Consommé par le stack infra/coolify."
  value       = scaleway_secret.server_key.name
}

output "ssh_key_secret_id" {
  description = "ID du secret Secret Manager contenant la clé privée SSH root."
  value       = scaleway_secret.server_key.id
}
