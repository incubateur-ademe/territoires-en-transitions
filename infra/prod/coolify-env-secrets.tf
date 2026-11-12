# --- Secrets des variables d'environnement Coolify, dérivés de l'infra ---
#
# Comme infra/nonprod/coolify-env-secrets.tf : ce que ce stack connaît déjà est
# rangé dans Secret Manager (projet tet-prod), d'où infra/coolify le pousse
# dans Coolify. Noms alignés sur local.coolify_env_derived_secrets
# (infra/coolify/env-manifest.tf) : tet-prod-<nom> dans /coolify-env/prod.
#
# Pour l'instant, seul Alloy : les secrets Postgres et Redis viendront avec
# les applications TET.

locals {
  coolify_env_secrets = {
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
