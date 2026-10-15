output "host_private_key_uuid" {
  description = "UUID de la clé host enregistrée dans Coolify pour le serveur localhost du control plane."
  value       = coolify_private_key.host.uuid
}

output "server_private_key_uuids" {
  description = "UUID des clés root enregistrées dans Coolify, indexés par tier."
  value       = { for k, v in coolify_private_key.server : k => v.uuid }
}

output "server_uuids" {
  description = "UUID des serveurs applicatifs enregistrés dans Coolify, indexés par tier."
  value       = { for k, v in coolify_server.app : k => v.uuid }
}

output "project_uuid" {
  description = "UUID du projet Coolify tet."
  value       = coolify_project.tet.uuid
}

output "environment_names" {
  description = "Nom de l'environnement Coolify (projet tet) de chaque environnement applicatif."
  value       = local.coolify_environment_names
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

output "application_uuids" {
  description = "UUID Coolify des applications déclarées, indexés par env/app."
  value       = { for k, v in coolify_application_docker_image.app : k => v.uuid }
}

output "env_manifest" {
  description = "Manifeste des variables par application (env/app), sans aucune valeur secrète : noms de secrets seulement. Sert au contrôle manifeste ↔ code."
  value       = { for id, p in local.coolify_env_pushes : id => p.manifest }
}

output "env_manual_secrets" {
  description = "Secrets à déposer à la main dans Secret Manager, par nom complet."
  value       = sort([for s in scaleway_secret.coolify_env_manual : "${s.path}/${s.name}"])
}
