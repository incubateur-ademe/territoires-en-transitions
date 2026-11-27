# Bucket de transit de l'export analytique de la prod.
#
#   prod ── export filtré, chaque nuit ──► ce bucket ◄── lecture ── tet-data-apps
#
# Le job de backup (.github/workflows/backup-database.yml) y dépose un export de
# la prod, déjà filtré (data_layer/backup/analytics-export.sh). Le serveur data
# le télécharge et reconstruit le schéma prod de la base de stats
# (prod-mirror/refresh-prod-mirror.sh). Aucune connexion ne part du tier data
# vers la prod, et le tier data ne lit jamais le bucket des backups complets.
#
# Les deux applications IAM sont créées par un admin de l'organisation (nos
# credentials n'ont pas ce droit), avec le droit IAM objets sur ce projet ; la
# bucket policy les cantonne ensuite à ce bucket et à leur sens.

variable "analytics_export" {
  description = "Applications IAM du bucket d'export analytique : writer_application_id dépose (job de backup), reader_application_id télécharge (serveur data). Null (défaut) : pas de bucket."
  type = object({
    writer_application_id = string
    reader_application_id = string
  })
  default = null
}

locals {
  analytics_export_bucket = "tet-analytics-export"
}

data "scaleway_iam_group" "tet_admin" {
  count = var.analytics_export == null ? 0 : 1
  name  = "tet-admin"
}

module "analytics_export_bucket" {
  count  = var.analytics_export == null ? 0 : 1
  source = "../modules/bucket"

  name = local.analytics_export_bucket

  tags = {
    tier       = "data"
    purpose    = "analytics-export"
    managed-by = "terraform"
  }

  # L'export de la nuit remplace celui de la veille : rien à garder.
  expiration_days = 7

  # Opérateurs : membres du groupe IAM tet-admin (cf. infra/prod/main.tf).
  admin_principals = concat(
    [for id in data.scaleway_iam_group.tet_admin[0].user_ids : "user_id:${id}"],
    [for id in data.scaleway_iam_group.tet_admin[0].application_ids : "application_id:${id}"],
  )

  statements = [
    {
      Sid       = "Writer"
      Effect    = "Allow"
      Principal = { SCW = ["application_id:${var.analytics_export.writer_application_id}"] }
      Action    = ["s3:PutObject"]
      Resource  = ["${local.analytics_export_bucket}/*"]
    },
    {
      Sid       = "Reader"
      Effect    = "Allow"
      Principal = { SCW = ["application_id:${var.analytics_export.reader_application_id}"] }
      Action    = ["s3:GetObject"]
      Resource  = ["${local.analytics_export_bucket}/*"]
    },
  ]
}

output "analytics_export_bucket_name" {
  description = "Bucket de l'export analytique (ANALYTICS_EXPORT_BUCKET du job de backup, EXPORT_BUCKET du miroir). Null sans var.analytics_export."
  value       = var.analytics_export == null ? null : local.analytics_export_bucket
}
