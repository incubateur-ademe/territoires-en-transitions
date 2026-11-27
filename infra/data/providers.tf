terraform {
  required_version = ">= 1.10.0"

  required_providers {
    # 2.79 minimum : scaleway_ipam_ip est requis par le module app-server.
    scaleway = {
      source  = "scaleway/scaleway"
      version = "~> 2.79"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    # Enregistrement du serveur dans la Team « TeT - Data » (coolify.tf).
    coolify = {
      source  = "coolify-terraform/coolify"
      version = "~> 0.1.35"
    }
  }
}

provider "scaleway" {
  project_id = var.project_id
  region     = var.scaleway_region
  zone       = var.scaleway_zone
}

# Team « TeT - Data » : même instance que infra/coolify, autre token. Le
# provider veut l'URL de base et ajoute /api/v1 lui-même.
provider "coolify" {
  endpoint = trimsuffix(var.coolify_endpoint, "/api/v1")
  token    = var.coolify_data_token
}
