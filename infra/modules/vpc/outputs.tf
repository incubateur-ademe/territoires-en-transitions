output "vpc_id" {
  description = "ID du VPC."
  value       = scaleway_vpc.main.id
}

output "private_network_id" {
  description = "ID du Private Network. À passer aux modules postgres et coolify."
  value       = scaleway_vpc_private_network.main.id
}

output "private_network_subnet" {
  description = "CIDR IPv4 du Private Network."
  value       = var.ipv4_subnet
}
