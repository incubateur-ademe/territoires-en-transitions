output "host_private_key_uuid" {
  description = "UUID de la clé host enregistrée dans Coolify pour le serveur localhost du control plane."
  value       = coolify_private_key.host.uuid
}

output "server_private_key_uuids" {
  description = "UUID des clés root enregistrées dans Coolify, indexés par tier."
  value       = { for k, v in coolify_private_key.server : k => v.uuid }
}

output "registered_server_names" {
  description = "Noms des serveurs applicatifs enregistrés dans Coolify, indexés par tier. Clés d'idempotence des scripts API."
  value       = { for k, v in var.app_servers : k => v.name }
}

output "project_uuids" {
  description = "UUID des projets Coolify créés, indexés par nom."
  value       = { for k, v in coolify_project.env : k => v.uuid }
}

output "s3_storage_name" {
  description = "Nom du S3 storage enregistré dans Coolify."
  value       = var.s3_storage_name
}

output "s3_bucket" {
  description = "Bucket Object Storage cible des backups Coolify."
  value       = var.s3_bucket
}

output "application_ids" {
  description = "Identifiants des applications déclarées (env/app). C'est l'APP_ID attendu par scripts/coolify-deploy.sh."
  value       = sort(keys(local.applications))
}
