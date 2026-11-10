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
    grafana = {
      source  = "grafana/grafana"
      version = "~> 4.0"
    }
  }
}

provider "scaleway" {
  project_id = var.project_id
  region     = var.scaleway_region
  zone       = var.scaleway_zone
}

# Grafana du Cockpit (dashboards, observability.tf). Il authentifie par IAM :
# la clé secrète passe en X-Auth-Token, le provider reste en anonymous.
provider "grafana" {
  url  = data.scaleway_cockpit_grafana.main.grafana_url
  auth = "anonymous"

  http_headers = {
    "X-Auth-Token" = var.scaleway_secret_key
  }
}
