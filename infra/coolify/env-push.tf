# --- Push des variables d'environnement vers Coolify ---
#
# Un terraform_data par application : rejoué quand son manifeste change, ou
# quand var.coolify_env_revision est incrémenté (rotation d'un secret, dont la
# valeur n'est pas dans le state). Le script résout toutes les valeurs avant
# d'écrire quoi que ce soit (cf. scripts/coolify-push-env.sh).
#
# Pousser ne redéploie pas : les variables sont lues au démarrage du conteneur.

resource "terraform_data" "env_push" {
  for_each = local.coolify_env_pushes

  triggers_replace = [
    jsonencode(each.value.manifest),
    each.value.secret_project_id,
    var.coolify_env_revision,
    var.coolify_env_prune,
    filesha256("${path.module}/../scripts/coolify-push-env.sh"),
    # Une application recréée repart sans variables.
    coolify_application_docker_image.app[each.key].uuid,
  ]

  # Les coquilles doivent exister pour que le script distingue « secret
  # absent » (oubli dans le manifeste) de « secret sans version » (valeur à
  # déposer).
  depends_on = [scaleway_secret.coolify_env_manual]

  lifecycle {
    precondition {
      condition     = length(setintersection(keys(each.value.entries), toset(local.coolify_env_image_provided_keys))) == 0
      error_message = "${each.key} : clé fournie par l'image Docker ou par le déploiement (${join(", ", local.coolify_env_image_provided_keys)}). La retirer du manifeste."
    }
    precondition {
      # Le repli NEXT_PUBLIC_* de public-env.ts n'existe que pour la
      # compatibilité : en poser réintroduirait le couplage image ↔ environnement.
      condition     = alltrue([for k in keys(each.value.entries) : !startswith(k, "NEXT_PUBLIC_")])
      error_message = "${each.key} : pas de NEXT_PUBLIC_*, la configuration runtime se lit sans préfixe."
    }
    precondition {
      condition     = alltrue([for k, e in each.value.entries : (try(e.value, null) != null) != (try(e.secret, null) != null)])
      error_message = "${each.key} : chaque entrée porte exactement un de value / secret."
    }
    precondition {
      # Anti-fuite : le manifeste est public. Une valeur en clair sur une clé au
      # nom sensible est presque toujours une erreur.
      condition = alltrue([
        for k, e in each.value.entries :
        try(e.value, null) == null || !can(regex("(SECRET|PASSWORD|TOKEN|CREDENTIAL|_API_KEY|SERVICE_ACCOUNT|DATABASE_URL|REDIS_URL)", k))
      ])
      error_message = "${each.key} : valeur en clair interdite sur une clé au nom sensible. La passer en secret."
    }
  }

  provisioner "local-exec" {
    command = "${path.module}/../scripts/coolify-push-env.sh"
    environment = {
      COOLIFY_ENDPOINT  = var.coolify_endpoint
      APP_ID            = each.key
      SECRET_PROJECT_ID = each.value.secret_project_id
      SECRET_PATH       = each.value.secret_path
      ENV_MANIFEST      = jsonencode(each.value.manifest)
      PRUNE             = tostring(var.coolify_env_prune)
      # COOLIFY_TOKEN et les credentials scw sont hérités de l'environnement
      # (tf-env.sh, coolify-env.sh).
    }
  }
}
