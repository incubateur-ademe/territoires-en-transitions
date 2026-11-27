# Bucket Object Storage et sa bucket policy, indissociables.
#
# Les permissions IAM Object Storage valent pour un projet entier : un bucket
# sans policy est ouvert à toute clé IAM du projet qui a des droits objets. La
# policy fonctionne en liste blanche : ce qu'elle n'autorise pas est refusé,
# opérateurs compris, d'où la déclaration Operators toujours présente.

terraform {
  required_version = ">= 1.10.0"

  required_providers {
    scaleway = {
      source  = "scaleway/scaleway"
      version = "~> 2.50"
    }
  }
}

resource "scaleway_object_bucket" "this" {
  name = var.name
  tags = var.tags

  # Une clé applicative qui a PutObject peut écraser un fichier existant : la
  # version précédente reste récupérable par un opérateur. Irréversible, et
  # sans expiration des anciennes versions : en ajouter une (lifecycle_rule)
  # si le volume le demande.
  versioning {
    enabled = true
  }

  # Bucket de transit (var.expiration_days) : les objets et leurs anciennes
  # versions expirent d'eux-mêmes.
  dynamic "lifecycle_rule" {
    for_each = var.expiration_days == null ? [] : [var.expiration_days]
    content {
      id      = "expiration"
      enabled = true

      abort_incomplete_multipart_upload_days = 1

      expiration {
        days = lifecycle_rule.value
      }

      noncurrent_version_expiration {
        noncurrent_days = lifecycle_rule.value
      }
    }
  }

  # Supprimer le bucket perdrait tous ses fichiers.
  lifecycle {
    prevent_destroy = true
  }
}

resource "scaleway_object_bucket_policy" "this" {
  bucket = scaleway_object_bucket.this.name

  policy = jsonencode({
    Version = "2023-04-17"
    Id      = var.name
    Statement = concat(var.statements, [
      {
        # Sans cette déclaration, le premier apply verrouille le bucket pour
        # celui qui vient de le lancer.
        Sid       = "Operators"
        Effect    = "Allow"
        Principal = { SCW = var.admin_principals }
        Action    = ["s3:*"]
        Resource  = [var.name, "${var.name}/*"]
      },
    ])
  })
}
