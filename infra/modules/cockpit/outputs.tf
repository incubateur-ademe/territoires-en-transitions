output "metrics_url" {
  description = "URL de la source de métriques custom. Cible de make cockpit-rules (API Mimir des règles)."
  value       = scaleway_cockpit_source.metrics.url
}

output "metrics_push_url" {
  description = "Remote write de la source de métriques custom (COCKPIT_METRICS_PUSH_URL d'Alloy)."
  value       = scaleway_cockpit_source.metrics.push_url
}

output "logs_push_url" {
  description = "Push Loki de la source de logs custom (COCKPIT_LOGS_PUSH_URL d'Alloy)."
  value       = scaleway_cockpit_source.logs.push_url
}

output "alloy_token" {
  description = "Token Cockpit d'Alloy, écriture seule (COCKPIT_TOKEN)."
  value       = scaleway_cockpit_token.alloy.secret_key
  sensitive   = true
}

output "dashboards_folder_url" {
  description = "URL du dossier des dashboards dans Grafana."
  value       = module.dashboards.folder_url
}
