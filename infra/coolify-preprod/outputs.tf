output "host_private_key_uuid" {
  description = "UUID de la clé host enregistrée dans Coolify. Référencé pour l'assignation au serveur localhost."
  value       = coolify_private_key.host.uuid
}
