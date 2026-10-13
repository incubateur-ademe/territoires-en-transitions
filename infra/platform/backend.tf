terraform {
  # State distant sur Scaleway Object Storage (compatible S3).
  # Locking natif via use_lockfile (Terraform >= 1.10) : écrit un .tflock dans
  # le bucket via un conditional write S3 (If-None-Match: *). Nécessite Object
  # Lock activé sur le bucket (cf. Bootstrap dans le README).
  #
  # Credentials fournis par les variables d'environnement AWS_ACCESS_KEY_ID /
  # AWS_SECRET_ACCESS_KEY (le backend S3 réutilise les conventions AWS, c'est
  # normal) — voir infra/scripts/tf-env.sh.
  backend "s3" {
    bucket = "tet-tfstate"
    key    = "platform/terraform.tfstate"
    region = "fr-par"

    endpoints = {
      s3 = "https://s3.fr-par.scw.cloud"
    }

    skip_credentials_validation = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    skip_s3_checksum            = true
    use_path_style              = true
    use_lockfile                = true
  }
}
