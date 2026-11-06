# --- Observabilité : Cockpit du projet principal ---
#
# Un Cockpit par projet Scaleway : celui-ci couvre tout le projet principal
# (preprod, staging, preview, control plane). La prod a le sien, dans le projet
# tet-prod. Ce stack le porte parce que la preprod est son premier client.
#
# Les métriques des produits Scaleway (RDB, Redis, Instances) arrivent seules
# et gratuitement dans les sources « Scaleway ». Les sources ci-dessous
# reçoivent ce qu'Alloy pousse (infra/observability/alloy), facturé au volume.
#
# Les règles d'alerte ne sont pas des ressources Terraform : elles vivent dans
# infra/observability/rules et passent par l'API Mimir (make cockpit-rules).

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

# Token d'Alloy : écriture seule. Rangé dans Secret Manager avec les URL de
# push (coolify-env-secrets.tf), d'où infra/coolify le pousse dans Coolify.
resource "scaleway_cockpit_token" "alloy" {
  name = "tet-nonprod-alloy"
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
# Grafana nomme la source « <nom> - <région> ». Il la crée de lui-même ; si
# elle manque, synchroniser les sources depuis la console Cockpit.

data "scaleway_cockpit_grafana" "main" {}

data "grafana_data_source" "metrics" {
  name = "${scaleway_cockpit_source.metrics.name} - ${var.scaleway_region}"
}

module "cockpit_dashboards" {
  source = "../modules/cockpit-dashboards"

  metrics_data_source_uid = data.grafana_data_source.metrics.uid
}
