output "vpc_id" {
  description = "ID du VPC partagé."
  value       = scaleway_vpc.main.id
}

output "vpc_name" {
  description = "Nom du VPC partagé."
  value       = scaleway_vpc.main.name
}

output "private_network_ids" {
  description = "IDs des Private Networks, indexés par tier. À passer aux modules app-server, postgres et redis."
  value       = { for k, pn in scaleway_vpc_private_network.main : k => pn.id }
}

output "private_network_subnets" {
  description = "CIDR IPv4 des Private Networks, indexés par tier."
  value       = { for k, v in var.private_networks : k => v.ipv4_subnet }
}

output "acl_id" {
  description = "ID de l'ACL VPC IPv4. Null si acl_enabled = false."
  value       = var.acl_enabled ? scaleway_vpc_acl.main[0].id : null
}

output "acl_ipv6_id" {
  description = "ID de l'ACL VPC IPv6. Null si acl_enabled = false."
  value       = var.acl_enabled ? scaleway_vpc_acl.ipv6[0].id : null
}
