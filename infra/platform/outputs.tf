# --- Réseau ---

output "vpc_id" {
  description = "ID du VPC partagé."
  value       = module.network.vpc_id
}

output "private_network_ids" {
  description = "IDs des Private Networks, indexés par tier."
  value       = module.network.private_network_ids
}

output "private_network_subnets" {
  description = "CIDR IPv4 des Private Networks, indexés par tier."
  value       = module.network.private_network_subnets
}

output "network_plan" {
  description = "Plan d'adressage complet. Les stacks applicatifs doivent déclarer les mêmes IP privées de serveur."
  value       = var.network_plan
}

# --- Passerelle VPN ---

output "vpn_public_ip" {
  description = "IP publique de la passerelle VPN. Les stacks nonprod, preview et prod la lisent d'office (platform.tf)."
  value       = module.vpn.public_ip
}

output "vpn_private_ip" {
  description = "IP privée de la passerelle VPN."
  value       = module.vpn.private_ip
}

output "vpn_endpoint" {
  description = "Endpoint WireGuard des postes opérateurs."
  value       = module.vpn.endpoint
}

output "vpn_client_allowed_ips" {
  description = "AllowedIPs de la configuration WireGuard des postes opérateurs."
  value       = module.vpn.client_allowed_ips
}

output "vpn_gateway_tunnel_ip" {
  description = "Adresse de la passerelle dans le tunnel : cible SSH (tet-ops) pour l'administrer."
  value       = cidrhost(var.vpn_tunnel_cidr, 1)
}

output "vpn_sshd_host_public_key" {
  description = "Clé d'hôte SSH de la passerelle, à épingler dans known_hosts."
  value       = module.vpn.sshd_host_public_key
}

# --- Stockage ---

output "coolify_backups_bucket_name" {
  description = "Nom du bucket Object Storage des backups Coolify. À reporter dans la variable s3_bucket du stack infra/coolify."
  value       = scaleway_object_bucket.coolify_backups.name
}

output "database_backups_bucket_name" {
  description = "Nom du bucket des dumps de la BDD de prod. À reporter dans la variable BACKUP_BUCKET de l'environnement GitHub prod."
  value       = scaleway_object_bucket.database_backups.name
}

output "coolify_backups_s3_endpoint" {
  description = "Endpoint S3 régional (path-style), sans le nom du bucket. Sert aussi de BACKUP_ENDPOINT_URL pour les dumps de la BDD."
  value       = "https://s3.${var.scaleway_region}.scw.cloud"
}

output "coolify_backups_project_id" {
  description = "ID du projet Scaleway dédié aux backups Coolify."
  value       = var.coolify_backups_project_id
}

output "coolify_backups_credentials_secret_name" {
  description = "Secret Secret Manager de la clé Object Storage des backups. À reporter dans la variable s3_credentials_secret_name du stack infra/coolify."
  value       = scaleway_secret.coolify_backups_credentials.name
}

output "prod_project_id" {
  description = "ID du projet Scaleway de production. À reporter dans la variable project_id du stack infra/prod."
  value       = var.prod_project_id
}

output "main_project_id" {
  description = "ID du projet Scaleway principal. À reporter dans la variable project_id du stack infra/preview."
  value       = var.main_project_id
}
