# --- Secrets des variables d'environnement Coolify, dérivés de l'infra ---
#
# Les valeurs que ce stack connaît déjà (URI Postgres, URI et CA Redis) sont
# rangées dans Secret Manager, d'où infra/coolify les pousse dans Coolify
# (env-push.tf). Elles sont déjà dans le state de ce stack (random_password) :
# les ranger ici n'expose rien de plus.
#
# Entre stacks, on ne passe que des noms de secrets : infra/coolify référence
# tet-preprod-<nom> dans /coolify-env/preprod, sans terraform_remote_state.
# Les noms courts doivent rester alignés sur local.coolify_env_derived_secrets
# (infra/coolify/env-manifest.tf).

locals {
  coolify_env_secrets = {
    "supabase-database-url" = {
      description = "SUPABASE_DATABASE_URL du backend preprod : RDB managé, réseau privé, sslmode=require."
      value       = module.postgres.private_connection_uri
    }
    "queue-redis-url" = {
      description = "QUEUE_REDIS_URL du backend preprod : Redis managé, réseau privé, TLS et authentification."
      value       = module.redis.private_connection_uri
    }
    "queue-redis-tls-ca" = {
      description = "QUEUE_REDIS_TLS_CA du backend preprod : CA du cluster Redis, pour vérifier la chaîne TLS."
      value       = module.redis.certificate
    }
  }
}

resource "scaleway_secret" "coolify_env" {
  for_each = local.coolify_env_secrets

  name        = "tet-preprod-${each.key}"
  path        = "/coolify-env/preprod"
  description = "${each.value.description} Géré par Terraform (infra/nonprod)."
  tags        = ["tet", "env:preprod", "managed-by:terraform", "coolify-env"]

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
