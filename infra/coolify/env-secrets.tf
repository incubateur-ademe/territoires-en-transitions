# --- Coquilles des secrets saisis à la main ---
#
# Les secrets applicatifs (clés Supabase, Brevo, compte de service Google…) n'ont
# pas de source dans l'infra : un opérateur dépose leur valeur. Terraform crée
# seulement le secret, vide, au bon nom et au bon path ; la valeur n'entre
# jamais dans le state.
#
#   infra/scripts/coolify-env-secret-set.sh <env> <nom-court> < fichier
#
# Les secrets dérivés de l'infra (local.coolify_env_derived_secrets) sont créés,
# valeur comprise, par le stack du tier.

resource "scaleway_secret" "coolify_env_manual" {
  for_each = local.coolify_env_manual_secrets

  project_id  = local.coolify_env_settings[split("/", each.key)[0]].secret_project_id
  name        = "tet-${split("/", each.key)[0]}-${split("/", each.key)[1]}"
  path        = "/coolify-env/${split("/", each.key)[0]}"
  description = "Valeur déposée à la main, poussée dans Coolify par infra/coolify (env-push.tf)."
  tags        = ["tet", "env:${split("/", each.key)[0]}", "managed-by:terraform", "coolify-env", "owner:manual"]

  # Un secret supprimé est irrécupérable : protected fait refuser la suppression
  # par l'API Scaleway, prevent_destroy bloque Terraform avant elle. Retirer une
  # clé du manifeste est donc un geste en deux temps : retirer la clé, puis
  # sortir le secret du state (terraform state rm) et le supprimer à la main.
  protected = true
  lifecycle {
    prevent_destroy = true
  }
}
