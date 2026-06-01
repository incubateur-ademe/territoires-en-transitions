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

  backup_schedule_frequency = 24
  backup_schedule_retention = 7
}
