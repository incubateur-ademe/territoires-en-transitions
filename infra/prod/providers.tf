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
  }
}

provider "scaleway" {
  project_id = var.main_project_id
  region     = var.scaleway_region
  zone       = var.scaleway_zone
}
