variable "token_name" {
  description = "Nom du token Cockpit d'Alloy (écriture seule), par exemple tet-prod-alloy."
  type        = string
}

variable "alert_emails" {
  description = "Destinataires des alertes du Cockpit (alertes préconfigurées et règles de infra/observability/rules)."
  type        = list(string)
}

variable "region" {
  description = "Région Scaleway du Cockpit : suffixe du nom de la source dans Grafana."
  type        = string
}
