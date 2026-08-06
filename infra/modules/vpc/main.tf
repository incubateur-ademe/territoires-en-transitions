terraform {
  required_providers {
    scaleway = {
      source  = "scaleway/scaleway"
      version = "~> 2.50"
    }
  }
}

resource "scaleway_vpc" "main" {
  name   = "tet-${var.environment}"
  region = var.region

  tags = ["tet", "env:${var.environment}", "managed-by:terraform"]
}

resource "scaleway_vpc_private_network" "main" {
  name   = "tet-${var.environment}-pn"
  vpc_id = scaleway_vpc.main.id
  region = var.region

  ipv4_subnet {
    subnet = var.ipv4_subnet
  }

  tags = ["tet", "env:${var.environment}", "managed-by:terraform"]
}
