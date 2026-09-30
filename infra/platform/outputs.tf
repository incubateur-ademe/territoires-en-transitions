# --- Réseau ---

output "vpc_id" {
  description = "ID du VPC partagé."
  value       = module.network.vpc_id
}

output "private_network_ids" {
  description = "IDs des Private Networks, indexés par tier. Valeur à reporter dans la variable private_network_id des stacks applicatifs."
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

# --- Control plane Coolify ---

output "coolify_server_id" {
  description = "ID Scaleway de la VM Coolify."
  value       = module.coolify.server_id
}

output "coolify_public_ip" {
  description = "IP publique du control plane. Cible de l'enregistrement A du dashboard, et hôte de saut (ssh -J) vers les serveurs applicatifs."
  value       = module.coolify.public_ip
}

output "coolify_private_ip" {
  description = "IP privée du control plane. Source des flux SSH autorisés par l'ACL du VPC."
  value       = module.coolify.private_ip
}

output "coolify_endpoint" {
  description = "URL de base de l'API Coolify (suffixe /api/v1 inclus). À reporter dans la variable coolify_endpoint du stack infra/coolify."
  value       = module.coolify.endpoint
}

output "coolify_host_ssh_key_secret_name" {
  description = "Nom du secret Secret Manager contenant la clé privée SSH host du control plane. Consommé par le stack infra/coolify."
  value       = module.coolify.host_ssh_key_secret_name
}

output "coolify_host_ssh_public_key" {
  description = "Clé publique SSH host autorisée sur root du control plane. Informative : déjà injectée par cloud-init."
  value       = module.coolify.host_ssh_public_key
}

# --- DNS ---

output "dns_zone_nameservers" {
  description = "Serveurs de noms de chaque zone créée, indexés par sous-domaine. À reporter chez le registrar sous forme d'enregistrements NS pour activer la délégation."
  value       = { for k, z in scaleway_domain_zone.env : k => z.ns }
}

output "dns_zone_domains" {
  description = "FQDN des zones déléguées, indexés par sous-domaine. À reporter dans la variable dns_zone des stacks applicatifs."
  value       = { for k, z in scaleway_domain_zone.env : k => "${z.subdomain}.${z.domain}" }
}

# --- Stockage ---

output "coolify_backups_bucket_name" {
  description = "Nom du bucket Object Storage des backups Coolify. À reporter dans la variable s3_bucket du stack infra/coolify."
  value       = scaleway_object_bucket.coolify_backups.name
}

output "coolify_backups_s3_endpoint" {
  description = "Endpoint S3 régional (path-style), sans le nom du bucket."
  value       = "https://s3.${var.scaleway_region}.scw.cloud"
}

output "backups_project_id" {
  description = "ID du projet Scaleway dédié aux backups."
  value       = var.backups_project_id
}

output "coolify_backups_credentials_secret_name" {
  description = "Secret Secret Manager de la clé Object Storage des backups. À reporter dans la variable s3_credentials_secret_name du stack infra/coolify."
  value       = scaleway_secret.coolify_backups_credentials.name
}

output "prod_project_id" {
  description = "ID du projet Scaleway de production. À reporter dans la variable main_project_id du stack infra/prod."
  value       = var.prod_project_id
}
