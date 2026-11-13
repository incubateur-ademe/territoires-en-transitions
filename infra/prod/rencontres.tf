# rencontres (dépôt incubateur-ademe/rencontres-tete, application Git de
# infra/coolify) : son bucket de fichiers et sa base, mutualisés avec TET.

# --- Fichiers ---
#
# Les permissions IAM Object Storage valent pour le projet entier, pas pour un
# bucket. L'isolation vient donc de la bucket policy, qui fonctionne en liste
# blanche : tout ce qu'elle n'autorise pas est refusé, opérateurs compris.
#
# RÈGLE pour tet-prod : un bucket sans policy reste ouvert à toute clé IAM du
# projet, donc à celle de rencontres. Tout bucket créé dans ce projet porte sa
# propre policy dès sa création (cf. infra/README.md).
#
# À faire à la main (droits d'organisation), une fois :
#   - donner à l'application tet-prod-rencontres-storage une politique IAM
#     limitée à tet-prod, avec ObjectStorageObjectsRead et
#     ObjectStorageObjectsWrite seulement. Ne PAS l'ajouter au groupe tet-app
#     (ObjectStorageFullAccess) : la bucket policy ne fait que restreindre les
#     droits IAM, qui bornent ce que la clé peut faire sur un bucket sans policy ;
#   - ranger la clé :
#       terraform -chdir=infra/prod output -raw rencontres_s3_access_key_id \
#         | infra/scripts/coolify-env-secret-set.sh prod rencontres-s3-access-key-id
#       terraform -chdir=infra/prod output -raw rencontres_s3_secret_key \
#         | infra/scripts/coolify-env-secret-set.sh prod rencontres-s3-secret-access-key

resource "scaleway_object_bucket" "rencontres" {
  name = "tet-prod-rencontres"

  tags = {
    env        = "prod"
    managed-by = "terraform"
    service    = "rencontres"
  }

  # Supprimer le bucket perdrait tous les fichiers téléversés.
  lifecycle {
    prevent_destroy = true
  }
}

resource "scaleway_iam_application" "rencontres_storage" {
  name        = "tet-prod-rencontres-storage"
  description = "rencontres prod : lecture et écriture sous uploads/ du bucket tet-prod-rencontres. Géré par Terraform (infra/prod)."
  # Pas de « : » dans les tags IAM, contrairement aux autres produits.
  tags = ["tet", "env=prod", "managed-by=terraform"]
}

resource "scaleway_iam_api_key" "rencontres_storage" {
  application_id = scaleway_iam_application.rencontres_storage.id
  description    = "Clé S3 de rencontres prod."
  # S3 cherche le bucket dans le projet préféré de la clé.
  default_project_id = var.project_id
}

resource "scaleway_object_bucket_policy" "rencontres" {
  bucket = scaleway_object_bucket.rencontres.name

  policy = jsonencode({
    Version = "2023-04-17"
    Id      = "tet-prod-rencontres"
    Statement = [
      {
        # Lecture publique des fichiers, sans ACL objet par objet. Le listing
        # reste fermé.
        Sid       = "LecturePublique"
        Effect    = "Allow"
        Principal = "*"
        Action    = ["s3:GetObject"]
        Resource  = ["${scaleway_object_bucket.rencontres.name}/uploads/*"]
      },
      {
        Sid       = "Application"
        Effect    = "Allow"
        Principal = { SCW = ["application_id:${scaleway_iam_application.rencontres_storage.id}"] }
        Action    = ["s3:GetObject", "s3:PutObject"]
        Resource  = ["${scaleway_object_bucket.rencontres.name}/uploads/*"]
      },
      {
        # Sans cette déclaration, le premier apply verrouille le bucket pour
        # celui qui vient de le lancer.
        Sid       = "Operateurs"
        Effect    = "Allow"
        Principal = { SCW = var.bucket_admin_principals }
        Action    = ["s3:*"]
        Resource = [
          scaleway_object_bucket.rencontres.name,
          "${scaleway_object_bucket.rencontres.name}/*",
        ]
      },
    ]
  })
}

# --- Base ---
#
# Base et rôle dédiés sur l'instance de TET. Le rôle n'a de droits que sur sa
# base. La base est restaurée avec ce rôle, qui devient propriétaire des tables.
#
# DATABASE_URL reste un secret déposé à la main (rencontres-database-url), pour
# que la bascule et le retour arrière soient le même geste :
#   terraform -chdir=infra/prod output -raw rencontres_database_url \
#     | infra/scripts/coolify-env-secret-set.sh prod rencontres-database-url

resource "scaleway_rdb_database" "rencontres" {
  instance_id = module.postgres.instance_id
  name        = "rencontres"
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
