# Buckets de Storage API (supabase-api), un par environnement du tier : les
# fichiers des utilisateurs, rangés sous <tenant>/<bucket>/<name>/<version>.
# Le nom est repris tel quel par SCW_S3_BUCKET (infra/coolify/env-manifest.tf).
#
# Storage y accède avec la clé d'une application IAM dédiée. Ses droits viennent
# du groupe tet-app (policy tet-buckets : ObjectStorageFullAccess sur ce
# projet), où l'admin de l'organisation l'ajoute à la main : ce stack n'a pas
# le droit de modifier un groupe. La clé est rangée à la main dans les secrets
# supabase-storage-s3-* :
#
#   terraform -chdir=infra/nonprod output -json storage_s3_access_key_ids | jq -r .preprod \
#     | infra/scripts/coolify-env-secret-set.sh preprod supabase-storage-s3-access-key-id
#   terraform -chdir=infra/nonprod output -json storage_s3_secret_keys | jq -r .preprod \
#     | infra/scripts/coolify-env-secret-set.sh preprod supabase-storage-s3-secret-access-key

locals {
  # staging : à ajouter avec son entrée dans le manifeste Coolify.
  storage_environments = toset(["preprod"])
}

resource "scaleway_object_bucket" "storage" {
  for_each = local.storage_environments

  name = "tet-${each.key}-storage"

  tags = {
    env        = each.key
    managed-by = "terraform"
    service    = "supabase-api"
  }

  # Supprimer le bucket perdrait tous les fichiers de l'environnement.
  lifecycle {
    prevent_destroy = true
  }
}

resource "scaleway_iam_application" "storage" {
  for_each = local.storage_environments

  name        = "tet-${each.key}-storage-api"
  description = "Storage API (supabase-api) ${each.key} : accès au bucket tet-${each.key}-storage. Géré par Terraform (infra/nonprod)."
  # Pas de « : » dans les tags IAM, contrairement aux autres produits.
  tags = ["tet", "env=${each.key}", "managed-by=terraform"]
}

resource "scaleway_iam_api_key" "storage" {
  for_each = local.storage_environments

  application_id = scaleway_iam_application.storage[each.key].id
  description    = "Clé S3 de Storage API ${each.key}."
  # S3 cherche le bucket dans le projet préféré de la clé.
  default_project_id = var.project_id
}
