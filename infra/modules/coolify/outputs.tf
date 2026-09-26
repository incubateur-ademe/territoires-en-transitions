output "server_id" {
  description = "ID Scaleway de la VM Coolify."
  value       = scaleway_instance_server.coolify.id
}

output "public_ip" {
  description = "IP publique réservée de la VM Coolify. Utiliser pour : (1) les règles DNS, (2) les ACL Postgres, (3) les allowlists SSH."
  value       = scaleway_instance_ip.coolify.address
}

output "private_nic_id" {
  description = "ID du NIC privé de la VM dans le Private Network."
  value       = scaleway_instance_private_nic.coolify.id
}

output "host_ssh_public_key" {
  description = "Clé publique SSH « host » autorisée sur root, à assigner au serveur localhost dans Coolify. Sa clé privée est dans Scaleway Secret Manager (host_ssh_key_secret_name)."
  value       = trimspace(tls_private_key.coolify_host.public_key_openssh)
}

output "host_ssh_key_secret_id" {
  description = "ID du secret Scaleway Secret Manager contenant la clé privée SSH host de Coolify."
  value       = scaleway_secret.coolify_host_key.id
}

output "host_ssh_key_secret_name" {
  description = "Nom du secret Scaleway Secret Manager contenant la clé privée SSH host de Coolify. À enregistrer dans Coolify > Keys & Tokens."
  value       = scaleway_secret.coolify_host_key.name
}
