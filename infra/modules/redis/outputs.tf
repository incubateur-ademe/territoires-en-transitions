locals {
  private_network = one(scaleway_redis_cluster.main.private_network)
  public_network  = one(scaleway_redis_cluster.main.public_network)
}

output "cluster_id" {
  description = "ID Scaleway du cluster Redis."
  value       = scaleway_redis_cluster.main.id
}

output "admin_user_name" {
  description = "Nom de l'utilisateur admin Redis."
  value       = scaleway_redis_cluster.main.user_name
}

output "admin_password" {
  description = "Mot de passe admin généré. À stocker dans Scaleway Secret Manager après le premier apply."
  value       = random_password.admin.result
  sensitive   = true
}

output "private_service_ips" {
  description = "IPs (format CIDR) assignées par IPAM dans le Private Network. Disponibles uniquement si private_network_id est fourni."
  value       = local.private_network != null ? local.private_network.service_ips : []
}

output "private_ip" {
  description = "IP privée du cluster dans le Private Network (sans masque CIDR). C'est l'adresse que les conteneurs Coolify utilisent."
  value = (
    local.private_network != null && length(local.private_network.service_ips) > 0
    ? split("/", local.private_network.service_ips[0])[0]
    : null
  )
}

output "public_ips" {
  description = "IPs publiques du cluster Redis. Vide si aucun endpoint public n'est activé."
  value       = local.public_network != null ? local.public_network.ips : []
}

output "public_port" {
  description = "Port de l'endpoint public Redis. Null si pas d'endpoint public."
  value       = local.public_network != null ? local.public_network.port : null
}

output "private_connection_uri" {
  description = "URI Redis via le réseau privé (TLS). C'est cette valeur à injecter dans QUEUE_REDIS_HOST_* des conteneurs Coolify."
  value = (
    local.private_network != null && length(local.private_network.service_ips) > 0
    ? format(
      "rediss://%s:%s@%s:6379",
      scaleway_redis_cluster.main.user_name,
      random_password.admin.result,
      split("/", local.private_network.service_ips[0])[0],
    )
    : null
  )
  sensitive = true
}

output "public_connection_uri" {
  description = "URI Redis publique (TLS). Utile pour accès opérateur. Null si aucun endpoint public."
  value = (
    local.public_network != null
    ? format(
      "rediss://%s:%s@%s:%d",
      scaleway_redis_cluster.main.user_name,
      random_password.admin.result,
      local.public_network.ips[0],
      local.public_network.port,
    )
    : null
  )
  sensitive = true
}
