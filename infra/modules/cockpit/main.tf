# Cockpit d'un projet Scaleway : sources custom où pousse Alloy
# (infra/observability/alloy), token d'écriture, alert manager, dashboards.
# Un Cockpit par projet : le projet est celui du provider scaleway du stack.
#
# Les métriques des produits Scaleway (RDB, Redis, Instances) arrivent seules
# et gratuitement dans les sources « Scaleway ». Les sources ci-dessous
# reçoivent ce qu'Alloy pousse, facturé au volume.
#
# Les règles d'alerte ne sont pas des ressources Terraform : elles vivent dans
# infra/observability/rules et passent par l'API Mimir (make cockpit-rules).

terraform {
  required_version = ">= 1.10.0"

  required_providers {
    scaleway = {
      source  = "scaleway/scaleway"
      version = "~> 2.79"
    }
    grafana = {
      source  = "grafana/grafana"
      version = "~> 4.0"
    }
  }
}

resource "scaleway_cockpit_source" "metrics" {
  name           = "tet-custom-metrics"
  type           = "metrics"
  retention_days = 31
}

resource "scaleway_cockpit_source" "logs" {
  name           = "tet-custom-logs"
  type           = "logs"
  retention_days = 14
}

# Token d'Alloy : écriture seule. Le stack le range dans Secret Manager avec
# les URL de push (coolify-env-secrets.tf), d'où infra/coolify le pousse dans
# Coolify.
resource "scaleway_cockpit_token" "alloy" {
  name = var.token_name
  scopes {
    write_metrics = true
    write_logs    = true
  }
}

# Alertes préconfigurées par Scaleway sur les produits managés : stockage, CPU
# et connexions de la RDB, CPU et mémoire du Redis, CPU des instances. Choisies
# par produit plutôt que par ID, pour suivre ce que Scaleway ajoute.
data "scaleway_cockpit_preconfigured_alert" "all" {}

resource "scaleway_cockpit_alert_manager" "main" {
  preconfigured_alert_ids = [
    for a in data.scaleway_cockpit_preconfigured_alert.all.alerts : a.preconfigured_rule_id
    if contains(["PostgreSQL", "Redis", "Instance"], a.product_name)
  ]

  dynamic "contact_points" {
    for_each = var.alert_emails
    content {
      email = contact_points.value
    }
  }
}

# --- Dashboards ---
#
# Grafana nomme la source « <nom> - <région> » et la crée de lui-même ; au
# premier apply elle peut manquer : synchroniser les sources depuis la console
# Cockpit, puis réappliquer.

data "grafana_data_source" "metrics" {
  name = "${scaleway_cockpit_source.metrics.name} - ${var.region}"
}

module "dashboards" {
  source = "../cockpit-dashboards"

  metrics_data_source_uid = data.grafana_data_source.metrics.uid
}
