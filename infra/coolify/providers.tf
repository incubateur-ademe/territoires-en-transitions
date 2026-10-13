terraform {
  required_version = ">= 1.10.0"

  required_providers {
    # Provider communautaire (Coolify v4), un seul mainteneur mais très actif
    # (sierrajc/coolify, l'ancien, n'a plus de release depuis août 2025).
    # Couvre clés, projet, environnements, serveurs, applications. Il ne sait
    # pas garder un secret hors du state (aucun attribut write-only) : les env
    # vars, le S3 storage et le login GHCR restent donc en scripts (R4).
    coolify = {
      source  = "coolify-terraform/coolify"
      version = "~> 0.1.26"
    }
    # scaleway : uniquement pour lire les clés privées depuis Secret Manager.
    scaleway = {
      source  = "scaleway/scaleway"
      version = "~> 2.79"
    }
  }
}

provider "scaleway" {
  project_id = var.project_id
  region     = var.scaleway_region
  zone       = var.scaleway_zone
}

provider "coolify" {
  # Le provider veut l'URL de base et ajoute /api/v1 lui-même ; les scripts
  # gardent var.coolify_endpoint tel quel.
  endpoint = trimsuffix(var.coolify_endpoint, "/api/v1")
  # Le provider marque `token` comme requis. On l'alimente par une variable
  # sensible, elle-même fournie via TF_VAR_coolify_token par
  # `source infra/scripts/coolify-env.sh` (token lu depuis Scaleway Secret
  # Manager). Aucun token en clair dans le repo ni dans le state (R4).
  token = var.coolify_token
}
