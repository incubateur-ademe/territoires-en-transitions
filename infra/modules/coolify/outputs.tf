output "server_id" {
  description = "ID Scaleway de la VM Coolify."
  value       = scaleway_instance_server.coolify.id
}

output "server_name" {
  description = "Nom de la VM Coolify."
  value       = var.name
}

output "public_ip" {
  description = "IP publique réservée du control plane. Cible de l'enregistrement DNS du dashboard, et hôte de saut (ssh -J) vers les serveurs applicatifs."
  value       = scaleway_instance_ip.coolify.address
}

output "private_ip" {
  description = "IP privée fixe du control plane. Source des flux SSH autorisés par l'ACL du VPC."
  value       = scaleway_ipam_ip.coolify.address
}

output "fqdn" {
  description = "FQDN du dashboard Coolify."
  value       = var.fqdn
}

output "endpoint" {
  description = "URL de base de l'API Coolify, suffixe /api/v1 inclus. À passer au stack infra/coolify."
  value       = "https://${var.fqdn}/api/v1"
}

output "host_ssh_public_key" {
  description = "Clé publique SSH host autorisée sur root. Informative : déjà injectée par cloud-init."
  value       = trimspace(tls_private_key.host.public_key_openssh)
}

output "host_ssh_key_secret_name" {
  description = "Nom du secret Secret Manager contenant la clé privée SSH host. Consommé par le stack infra/coolify."
  value       = scaleway_secret.host_key.name
}

output "host_ssh_key_secret_id" {
  description = "ID du secret Secret Manager contenant la clé privée SSH host."
  value       = scaleway_secret.host_key.id
}
