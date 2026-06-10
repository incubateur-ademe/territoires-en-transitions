module "vpc" {
  source = "../modules/vpc"

  environment = "preprod"
  region      = var.scaleway_region
  ipv4_subnet = var.vpc_ipv4_subnet
}

module "postgres" {
  source = "../modules/postgres"

  environment       = "preprod"
  region            = var.scaleway_region
  node_type         = var.pg_node_type
  engine            = "PostgreSQL-15"
  is_ha_cluster     = false
  volume_size_in_gb = var.pg_volume_size_in_gb
  allowed_ips       = var.pg_allowed_ips
  database_name     = "tet"
  private_network_id = module.vpc.private_network_id

  backup_schedule_frequency = 24
  backup_schedule_retention = 7
}

module "coolify" {
  source = "../modules/coolify"

  environment        = "preprod"
  zone               = var.scaleway_zone
  instance_type      = var.coolify_instance_type
  private_network_id = module.vpc.private_network_id
  ssh_allowed_ips    = var.coolify_ssh_allowed_ips
  ssh_authorized_keys = var.coolify_ssh_authorized_keys
}
