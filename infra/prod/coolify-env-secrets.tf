# --- Secrets des variables d'environnement Coolify, dérivés de l'infra ---
#
# Comme infra/nonprod/coolify-env-secrets.tf : ce que ce stack connaît déjà est
# rangé dans Secret Manager (projet tet-prod), d'où infra/coolify le pousse
# dans Coolify. Noms alignés sur local.coolify_env_derived_secrets
# (infra/coolify/env-manifest.tf) : tet-prod-<nom> dans /coolify-env/prod.
#
# Les secrets de TET (Postgres, Redis) ne sont lus par
# aucune application tant que prod n'est pas dans application_environments
# (infra/coolify) : les poser avant la bascule ne change rien au service.

locals {
  coolify_env_secrets = {
    "supabase-database-url" = {
      description = "SUPABASE_DATABASE_URL du backend prod : RDB managé, réseau privé, TLS vérifié par postgres-tls-ca."
      # Sans sslmode : pour node-postgres, require vaut verify-full sans la CA
      # (certificat auto-signé refusé) et remplacerait celle de
      # SUPABASE_DATABASE_SSL_ROOT_CERT (postgres-tls-ca).
      value = format("postgres://%s:%s@%s:%d/%s",
        module.postgres.admin_user_name, module.postgres.admin_password,
      module.postgres.private_endpoint_ip, module.postgres.private_endpoint_port, module.postgres.database_name)
    }
    # Mots de passe restreints à -_.!*~ (main.tf) : injectables sans
    # percent-encoding.
    "gotrue-db-database-url" = {
      description = "GOTRUE_DB_DATABASE_URL de supabase-api prod : rôle supabase_auth_admin, réseau privé, schéma auth, TLS vérifié par postgres-tls-ca (écrite dans /tmp/rdb-ca.pem par le compose)."
      value = format("postgres://%s:%s@%s:%d/%s?sslmode=verify-ca&sslrootcert=/tmp/rdb-ca.pem&search_path=auth",
        scaleway_rdb_user.supabase_auth_admin.name, random_password.supabase_auth_admin.result,
      module.postgres.private_endpoint_ip, module.postgres.private_endpoint_port, module.postgres.database_name)
    }
    "storage-db-database-url" = {
      description = "STORAGE_DB_DATABASE_URL de supabase-api prod : rôle supabase_storage_admin, réseau privé, TLS vérifié par postgres-tls-ca."
      # Sans sslmode : pour node-postgres, il remplacerait la CA de
      # DATABASE_SSL_ROOT_CERT (postgres-tls-ca), qui active seule le TLS.
      value = format("postgres://%s:%s@%s:%d/%s",
        scaleway_rdb_user.supabase_storage_admin.name, random_password.supabase_storage_admin.result,
      module.postgres.private_endpoint_ip, module.postgres.private_endpoint_port, module.postgres.database_name)
    }
    "queue-redis-url" = {
      description = "QUEUE_REDIS_URL du backend prod : Redis managé, réseau privé, TLS et authentification."
      value       = module.redis.private_connection_uri
    }
    "queue-redis-tls-ca" = {
      description = "QUEUE_REDIS_TLS_CA du backend prod : CA du cluster Redis, pour vérifier la chaîne TLS."
      value       = module.redis.certificate
    }
    "postgres-tls-ca" = {
      description = "Certificat auto-signé de la RDB prod (DATABASE_SSL_ROOT_CERT de Storage), pour vérifier le TLS."
      value       = module.postgres.certificate
    }
    "cockpit-token" = {
      description = "COCKPIT_TOKEN d'Alloy : token Cockpit en écriture seule (métriques et logs) du projet tet-prod."
      value       = module.cockpit.alloy_token
    }
    "cockpit-metrics-push-url" = {
      description = "COCKPIT_METRICS_PUSH_URL d'Alloy : remote write de la source de métriques custom du Cockpit."
      value       = module.cockpit.metrics_push_url
    }
    "cockpit-logs-push-url" = {
      description = "COCKPIT_LOGS_PUSH_URL d'Alloy : push Loki de la source de logs custom du Cockpit."
      value       = module.cockpit.logs_push_url
    }
    "rencontres-s3-access-key-id" = {
      description = "S3_ACCESS_KEY_ID de rencontres : clé de l'application IAM tet-prod-rencontres-storage (rencontres.tf)."
      value       = scaleway_iam_api_key.rencontres_storage.access_key
    }
    "rencontres-s3-secret-access-key" = {
      description = "S3_SECRET_ACCESS_KEY de rencontres."
      value       = scaleway_iam_api_key.rencontres_storage.secret_key
    }
  }
}

resource "scaleway_secret" "coolify_env" {
  for_each = local.coolify_env_secrets

  name        = "tet-prod-${each.key}"
  path        = "/coolify-env/prod"
  description = "${each.value.description} Géré par Terraform (infra/prod)."
  tags        = ["tet", "env:prod", "managed-by:terraform", "coolify-env"]

  # Un secret supprimé est irrécupérable. protected fait refuser la suppression
  # par l'API Scaleway, prevent_destroy bloque Terraform avant elle.
  protected = true
  lifecycle {
    prevent_destroy = true
  }
}

resource "scaleway_secret_version" "coolify_env" {
  for_each = local.coolify_env_secrets

  secret_id = scaleway_secret.coolify_env[each.key].id
  data      = each.value.value
}
