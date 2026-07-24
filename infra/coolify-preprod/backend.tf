terraform {
  # Couche « Coolify-as-code » : state DISTINCT de infra/preprod/ (Scaleway).
  # Raison : cette couche dépend de Coolify *déjà up et joignable*. La garder
  # séparée évite que le `plan` de l'infra Scaleway exige que l'appli tourne
  # (couplage / poule-œuf au premier boot). Même bucket, clé différente.
  backend "s3" {
    bucket = "tet-preprod-tfstate"
    key    = "coolify-preprod/terraform.tfstate"
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
