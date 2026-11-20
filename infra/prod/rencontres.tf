# rencontres (dépôt incubateur-ademe/rencontres-tete, application Git de
# infra/coolify) : son bucket de fichiers et sa base, mutualisés avec TET.

# --- Fichiers ---
#
# Les permissions IAM Object Storage valent pour le projet entier, pas pour un
# bucket. L'isolation vient donc de la bucket policy, que modules/bucket pose
# avec le bucket.
#
# RÈGLE pour tet-prod : un bucket sans policy reste ouvert à toute clé IAM du
# projet, donc à celle de rencontres. Tout bucket de ce projet se crée par
# modules/bucket, jamais par un scaleway_object_bucket nu (cf. infra/README.md).
# La CI (_ci-infra.yml) refuse un scaleway_object_bucket dans infra/prod ; un
# bucket créé à la main (console, scw, rclone) lui échappe.
#
# À faire à la main (droits d'organisation), une fois :
#   - donner à l'application tet-prod-rencontres-storage une politique IAM
#     limitée à tet-prod, avec ObjectStorageObjectsWrite seulement (l'appli ne
#     fait que PutObject, la lecture est publique). Ne PAS l'ajouter au groupe
#     tet-app (ObjectStorageFullAccess) : la bucket policy ne fait que
#     restreindre les droits IAM, qui bornent ce que la clé peut faire sur un
#     bucket sans policy.
#
# La clé va dans Secret Manager par coolify-env-secrets.tf, d'où infra/coolify
# la pousse : rien à déposer à la main.

resource "scaleway_iam_application" "rencontres_storage" {
  name        = "tet-prod-rencontres-storage"
  description = "rencontres prod : écriture sous uploads/ du bucket tet-prod-rencontres. Géré par Terraform (infra/prod)."
  # Pas de « : » dans les tags IAM, contrairement aux autres produits.
  tags = ["tet", "env=prod", "managed-by=terraform"]
}

resource "scaleway_iam_api_key" "rencontres_storage" {
  application_id = scaleway_iam_application.rencontres_storage.id
  description    = "Clé S3 de rencontres prod."
  # S3 cherche le bucket dans le projet préféré de la clé.
  default_project_id = var.project_id
}

locals {
  rencontres_bucket = "tet-prod-rencontres"
}

module "rencontres_bucket" {
  source = "../modules/bucket"

  name = local.rencontres_bucket

  tags = {
    env        = "prod"
    managed-by = "terraform"
    service    = "rencontres"
  }

  admin_principals = local.bucket_admin_principals

  statements = [
    {
      # Lecture publique des fichiers, sans ACL objet par objet. Le listing
      # reste fermé.
      Sid       = "PublicRead"
      Effect    = "Allow"
      Principal = "*"
      Action    = ["s3:GetObject"]
      Resource  = ["${local.rencontres_bucket}/uploads/*"]
    },
    {
      Sid       = "Application"
      Effect    = "Allow"
      Principal = { SCW = ["application_id:${scaleway_iam_application.rencontres_storage.id}"] }
      # La lecture passe par PublicRead.
      Action   = ["s3:PutObject"]
      Resource = ["${local.rencontres_bucket}/uploads/*"]
    },
  ]
}

# --- Base ---
#
# Base et rôle dédiés sur l'instance de TET. La base est restaurée avec ce
# rôle, qui devient propriétaire des tables.
#
# Le rôle ne doit rien pouvoir faire sur la base de TET : le privilège « none »
# plus bas le déclare. Vérifié sur RDB le 2026-11-16 : « none » retire bien
# CONNECT (« User does not have CONNECT privilege ») et se relit sans diff. Le
# contrôle est dans infra/RUNBOOKS.md, « Rencontres : après le premier apply ».
#
# DATABASE_URL reste un secret déposé à la main (rencontres-database-url), pour
# que la bascule et le retour arrière soient le même geste. Les secrets de la
# prod sont dans tet-prod, pas dans le projet par défaut du script :
#   export SECRET_PROJECT_ID="$(terraform -chdir=infra/platform output -raw prod_project_id)"
#   terraform -chdir=infra/prod output -raw rencontres_database_url \
#     | infra/scripts/coolify-env-secret-set.sh prod rencontres-database-url

resource "scaleway_rdb_database" "rencontres" {
  instance_id = module.postgres.instance_id
  name        = "rencontres"

  # Le prevent_destroy de l'instance ne couvre pas ses bases.
  lifecycle {
    prevent_destroy = true
  }
}

resource "random_password" "rencontres" {
  length  = 32
  special = true
  # Caractères URL-safe, pour injection directe dans DATABASE_URL.
  override_special = "-_.!*~"
  min_lower        = 1
  min_upper        = 1
  min_numeric      = 1
  min_special      = 1
}

resource "scaleway_rdb_user" "rencontres" {
  instance_id = module.postgres.instance_id
  name        = "rencontres"
  password    = random_password.rencontres.result
  is_admin    = false
}

resource "scaleway_rdb_privilege" "rencontres" {
  instance_id   = module.postgres.instance_id
  database_name = scaleway_rdb_database.rencontres.name
  user_name     = scaleway_rdb_user.rencontres.name
  permission    = "all"
}

resource "scaleway_rdb_privilege" "rencontres_tet" {
  instance_id   = module.postgres.instance_id
  database_name = module.postgres.database_name
  user_name     = scaleway_rdb_user.rencontres.name
  permission    = "none"
}
