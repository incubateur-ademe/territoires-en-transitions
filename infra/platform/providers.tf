terraform {
  required_version = ">= 1.10.0"

  required_providers {
    # 2.79 minimum : scaleway_vpc_acl et scaleway_ipam_ip sont requis ici.
    scaleway = {
      source  = "scaleway/scaleway"
      version = "~> 2.79"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
}

provider "scaleway" {
  project_id = var.scaleway_project_id
  region     = var.scaleway_region
  zone       = var.scaleway_zone
}
