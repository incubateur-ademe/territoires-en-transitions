# --- Observabilité : Cockpit du projet tet-prod ---
#
# Le Cockpit de la prod, distinct de celui du projet principal
# (infra/nonprod/observability.tf) : les logs et métriques de la prod restent
# dans le projet tet-prod. Même définition que là-bas : modules/cockpit.
#
# Règles d'alerte : make cockpit-rules (infra/prod/Makefile), mêmes fichiers
# que le projet principal (infra/observability/rules).

module "cockpit" {
  source = "../modules/cockpit"

  token_name   = "tet-prod-alloy"
  alert_emails = var.alert_emails
  region       = var.scaleway_region
}

# URL du Grafana, pour le provider grafana (providers.tf).
data "scaleway_cockpit_grafana" "main" {}
