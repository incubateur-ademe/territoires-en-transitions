terraform {
  # State distant sur Scaleway Object Storage (compatible S3).
  # Locking natif activé via use_lockfile (Terraform >= 1.10) : écrit un fichier
  # .tflock dans le bucket via un conditional write S3 (If-None-Match: *).
  # Nécessite Object Lock activé sur le bucket (cf. Bootstrap dans le README).
  #
  # Les credentials S3 sont fournis via les variables d'environnement :
  #   AWS_ACCESS_KEY_ID     = clé d'accès Scaleway
  #   AWS_SECRET_ACCESS_KEY = secret Scaleway
  # (le backend S3 réutilise les conventions de nommage AWS, c'est normal)
  #
  # En CI : injection via OIDC GitHub → IAM Scaleway (clés courte durée).
  # En local : `scw config get access-key` puis export manuel, ou utiliser
  # un wrapper qui les charge depuis ~/.config/scw/config.yaml.
  backend "s3" {
    bucket = "tet-preprod-tfstate"
    key    = "preprod/terraform.tfstate"
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
