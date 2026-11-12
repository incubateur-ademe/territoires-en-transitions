# --- Observabilité : Cockpit du projet principal ---
#
# Un Cockpit par projet Scaleway : celui-ci couvre tout le projet principal
# (preprod, staging, preview, control plane). La prod a le sien, dans le projet
# tet-prod. Ce stack le porte parce que la preprod est son premier client.
# Définition commune aux deux : modules/cockpit.
#
# Règles d'alerte : make cockpit-rules (infra/nonprod/Makefile).

module "cockpit" {
  source = "../modules/cockpit"

  token_name   = "tet-nonprod-alloy"
  alert_emails = var.alert_emails
  region       = var.scaleway_region
}

# URL du Grafana, pour le provider grafana (providers.tf).
data "scaleway_cockpit_grafana" "main" {}
