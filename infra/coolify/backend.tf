terraform {
  # Couche « Coolify-as-code » : state DISTINCT des stacks Scaleway
  # (platform, prod, nonprod, preview). Raison : cette couche dépend de Coolify
  # *déjà up et joignable*. La garder séparée évite que le `plan` de l'infra
  # Scaleway exige que l'appli tourne (poule-œuf au premier boot).
  # Même bucket, clé différente.
  #
  # coolify-incubateur : state de l'instance de l'incubateur. L'ancien,
  # coolify/terraform.tfstate, décrit l'instance qu'on quitte : ses UUID n'ont
  # aucun sens ailleurs, on ne le migre pas.
  backend "s3" {
    bucket = "tet-tfstate"
    key    = "coolify-incubateur/terraform.tfstate"
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
