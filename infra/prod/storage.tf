# Bucket de Storage API (supabase-api) prod : les fichiers des utilisateurs,
# rangés sous <tenant>/<bucket>/<name>/<version>. Même schéma que
# nonprod/storage.tf, mais par modules/bucket comme tout bucket de tet-prod
# (cf. rencontres.tf) : sans policy, toute clé IAM du projet y aurait accès.
# Le nom est repris tel quel par SCW_S3_BUCKET (infra/coolify/env-manifest.tf).
#
# À faire à la main (droits d'organisation), une fois : donner à l'application
# tet-prod-storage-api une politique IAM limitée à tet-prod, avec
# ObjectStorageObjectsRead, ObjectStorageObjectsWrite et
# ObjectStorageObjectsDelete. Pas de groupe tet-app.
#
# La clé se range à la main, comme en preprod : supabase-storage-s3-* sont des
# secrets manuels du manifeste (infra/coolify), communs à tous les
# environnements. coolify-env-secret-set.sh ne fait qu'ajouter une version :
# les coquilles tet-prod-supabase-storage-s3-* n'existent qu'une fois
# prod/supabase-api déclaré dans le manifeste et infra/coolify appliqué. Ce
# n'est pas encore le cas : déposer la clé après ce manifeste. Secrets de la
# prod dans tet-prod :
#   export SECRET_PROJECT_ID="$(terraform -chdir=infra/platform output -raw prod_project_id)"
#   terraform -chdir=infra/prod output -raw storage_s3_access_key_id \
#     | infra/scripts/coolify-env-secret-set.sh prod supabase-storage-s3-access-key-id
#   terraform -chdir=infra/prod output -raw storage_s3_secret_key \
#     | infra/scripts/coolify-env-secret-set.sh prod supabase-storage-s3-secret-access-key

locals {
  storage_bucket = "tet-prod-storage"
}

resource "scaleway_iam_application" "storage" {
  name        = "tet-prod-storage-api"
  description = "Storage API (supabase-api) prod : accès au bucket tet-prod-storage. Géré par Terraform (infra/prod)."
  # Pas de « : » dans les tags IAM, contrairement aux autres produits.
  tags = ["tet", "env=prod", "managed-by=terraform"]
}

resource "scaleway_iam_api_key" "storage" {
  application_id = scaleway_iam_application.storage.id
  description    = "Clé S3 de Storage API prod."
  # S3 cherche le bucket dans le projet préféré de la clé.
  default_project_id = var.project_id
}

module "storage_bucket" {
  source = "../modules/bucket"

  name = local.storage_bucket

  tags = {
    env        = "prod"
    managed-by = "terraform"
    service    = "supabase-api"
  }

  # Les opérateurs servent aussi à la copie rclone depuis Supabase à la bascule.
  admin_principals = local.bucket_admin_principals

  statements = [
    {
      # Pas d'accès public : les fichiers sont servis par Storage API.
      Sid       = "StorageApi"
      Effect    = "Allow"
      Principal = { SCW = ["application_id:${scaleway_iam_application.storage.id}"] }
      # Opérations sur les objets seulement (dont l'upload multipart et
      # TUS) : l'administration du bucket (policy, ACL, suppression) reste aux
      # opérateurs.
      Action = [
        "s3:GetObject", "s3:PutObject", "s3:DeleteObject",
        "s3:AbortMultipartUpload", "s3:ListMultipartUploadParts",
      ]
      Resource = ["${local.storage_bucket}/*"]
    },
    {
      Sid       = "StorageApiList"
      Effect    = "Allow"
      Principal = { SCW = ["application_id:${scaleway_iam_application.storage.id}"] }
      Action    = ["s3:ListBucket", "s3:ListBucketMultipartUploads"]
      Resource  = [local.storage_bucket]
    },
  ]
}
