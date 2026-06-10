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
