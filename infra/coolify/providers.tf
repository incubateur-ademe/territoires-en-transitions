terraform {
  required_version = ">= 1.10.0"

  required_providers {
    # Provider communautaire (Coolify v4). Maturité « beta » — la couverture est
    # bonne pour keys/projects/env vars, mais la ressource coolify_server est
    # marquée « not fully implemented » : on ne l'utilise pas ici (cf. main.tf).
    coolify = {
      source  = "sierrajc/coolify"
      version = "~> 0.10"
    }
    # scaleway : uniquement pour lire les clés privées depuis Secret Manager.
    scaleway = {
      source  = "scaleway/scaleway"
      version = "~> 2.79"
    }
  }
}

provider "scaleway" {
  project_id = var.main_project_id
  region     = var.scaleway_region
  zone       = var.scaleway_zone
}

provider "coolify" {
  endpoint = var.coolify_endpoint
  # Le provider marque `token` comme requis. On l'alimente par une variable
  # sensible, elle-même fournie via TF_VAR_coolify_token par
  # `source infra/scripts/coolify-env.sh` (token lu depuis Scaleway Secret
  # Manager). Aucun token en clair dans le repo ni dans le state (R4).
  token = var.coolify_token
}
