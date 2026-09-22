output "host_private_key_uuid" {
  description = "UUID de la clé host enregistrée dans Coolify. Référencé pour l'assignation au serveur localhost."
  value       = coolify_private_key.host.uuid
}

output "s3_storage_name" {
  description = "Nom du S3 storage Coolify (Scaleway). UUID visible dans Coolify > S3 Storages après apply ; à référencer ensuite dans les backups (s3_storage_uuid)."
  value       = var.s3_storage_name
}

output "s3_bucket" {
  description = "Bucket Scaleway Object Storage enregistré dans Coolify."
  value       = var.s3_bucket
}
