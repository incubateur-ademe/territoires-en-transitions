# Dashboards Grafana d'un Cockpit, construits sur les métriques qu'Alloy pousse
# (infra/observability/alloy/config.alloy). Écrits ici plutôt qu'importés de
# grafana.com : Alloy ne garde qu'une partie des métriques et pose ses propres
# labels (server, env, service, container), sur lesquels les dashboards
# communautaires ne filtrent pas.
#
# Une métrique ajoutée à un panneau doit aussi passer les règles keep d'Alloy.

terraform {
  required_version = ">= 1.10.0"

  required_providers {
    grafana = {
      source  = "grafana/grafana"
      version = "~> 4.0"
    }
  }
}

locals {
  ds = { type = "prometheus", uid = var.metrics_data_source_uid }

  # Filtres repris dans les expressions : $server est commun à tous les dashboards.
  host_f      = "server=~\"$server\""
  container_f = "server=~\"$server\", env=~\"$env\", service=~\"$service\""
  traefik_f   = "server=~\"$server\", service=~\"$service\""
  probe_f     = "server=~\"$server\", env=~\"$env\""
  by_ctr      = "env, service, container"
  ctr_legend  = "{{env}}/{{service}} {{container}}"

  dashboards = {
    host = {
      title = "Hôte"
      vars  = []
      panels = [
        { title = "CPU utilisé", unit = "percentunit", legend = "{{server}}",
        expr = "1 - avg by (server) (rate(node_cpu_seconds_total{mode=\"idle\", ${local.host_f}}[5m]))" },
        { title = "Charge (1 min)", unit = "short", legend = "{{server}}",
        expr = "node_load1{${local.host_f}}" },
        { title = "Mémoire utilisée", unit = "percentunit", legend = "{{server}}",
        expr = "1 - node_memory_MemAvailable_bytes{${local.host_f}} / node_memory_MemTotal_bytes{${local.host_f}}" },
        { title = "Disque utilisé", unit = "percentunit", legend = "{{server}} {{mountpoint}}",
        expr = "1 - node_filesystem_avail_bytes{${local.host_f}} / node_filesystem_size_bytes{${local.host_f}}" },
        { title = "Réseau reçu", unit = "Bps", legend = "{{server}} {{device}}",
        expr = "rate(node_network_receive_bytes_total{${local.host_f}}[5m])" },
        { title = "Réseau émis", unit = "Bps", legend = "{{server}} {{device}}",
        expr = "rate(node_network_transmit_bytes_total{${local.host_f}}[5m])" },
        { title = "Disque occupé (temps d'I/O)", unit = "percentunit", legend = "{{server}} {{device}}",
        expr = "rate(node_disk_io_time_seconds_total{${local.host_f}}[5m])" },
        { title = "Pression mémoire (attente)", unit = "percentunit", legend = "{{server}}",
        expr = "rate(node_pressure_memory_waiting_seconds_total{${local.host_f}}[5m])" },
      ]
    }

    containers = {
      title = "Conteneurs"
      vars = [
        { name = "env", query = "label_values(container_start_time_seconds{${local.host_f}}, env)" },
        { name = "service", query = "label_values(container_start_time_seconds{${local.host_f}, env=~\"$env\"}, service)" },
      ]
      panels = [
        { title = "CPU (cœurs)", unit = "short", legend = local.ctr_legend,
        expr = "sum by (${local.by_ctr}) (rate(container_cpu_usage_seconds_total{${local.container_f}}[5m]))" },
        { title = "Mémoire", unit = "bytes", legend = local.ctr_legend,
        expr = "sum by (${local.by_ctr}) (container_memory_working_set_bytes{${local.container_f}})" },
        # Sans limite, container_spec_memory_limit_bytes vaut 0 : écarté.
        { title = "Mémoire / limite", unit = "percentunit", legend = local.ctr_legend,
        expr = "sum by (${local.by_ctr}) (container_memory_working_set_bytes{${local.container_f}}) / sum by (${local.by_ctr}) (container_spec_memory_limit_bytes{${local.container_f}} > 0)" },
        { title = "Redémarrages (15 min)", unit = "short", legend = local.ctr_legend,
        expr = "sum by (${local.by_ctr}) (changes(container_start_time_seconds{${local.container_f}}[15m]))" },
        { title = "Réseau reçu", unit = "Bps", legend = local.ctr_legend,
        expr = "sum by (${local.by_ctr}) (rate(container_network_receive_bytes_total{${local.container_f}}[5m]))" },
        { title = "Réseau émis", unit = "Bps", legend = local.ctr_legend,
        expr = "sum by (${local.by_ctr}) (rate(container_network_transmit_bytes_total{${local.container_f}}[5m]))" },
        { title = "OOM (15 min)", unit = "short", legend = local.ctr_legend,
        expr = "sum by (${local.by_ctr}) (increase(container_oom_events_total{${local.container_f}}[15m]))" },
      ]
    }

    # Le label service est le nom Traefik du service Coolify (UUID de l'application).
    traefik = {
      title = "Traefik"
      vars = [
        { name = "service", query = "label_values(traefik_service_requests_total{${local.host_f}}, service)" },
      ]
      panels = [
        { title = "Requêtes par service", unit = "reqps", legend = "{{service}}",
        expr = "sum by (service) (rate(traefik_service_requests_total{${local.traefik_f}}[5m]))" },
        { title = "Réponses par code", unit = "reqps", legend = "{{code}}",
        expr = "sum by (code) (rate(traefik_service_requests_total{${local.traefik_f}}[5m]))" },
        { title = "Part de 5xx", unit = "percentunit", legend = "{{service}}",
        expr = "sum by (service) (rate(traefik_service_requests_total{code=~\"5..\", ${local.traefik_f}}[5m])) / sum by (service) (rate(traefik_service_requests_total{${local.traefik_f}}[5m]))" },
        { title = "Latence p95", unit = "s", legend = "{{service}}",
        expr = "histogram_quantile(0.95, sum by (service, le) (rate(traefik_service_request_duration_seconds_bucket{${local.traefik_f}}[5m])))" },
      ]
    }

    # instance vaut prometheus.exporter.blackbox.probes pour toutes les sondes :
    # les légendes s'appuient sur env / service / container.
    probes = {
      title = "Sondes HTTPS"
      vars = [
        { name = "env", query = "label_values(probe_success{${local.host_f}}, env)" },
      ]
      panels = [
        { title = "Disponibilité", unit = "percentunit", legend = local.ctr_legend,
        expr = "avg_over_time(probe_success{${local.probe_f}}[5m])" },
        { title = "Durée de la sonde", unit = "s", legend = local.ctr_legend,
        expr = "probe_duration_seconds{${local.probe_f}}" },
        { title = "Code HTTP", unit = "none", legend = local.ctr_legend,
        expr = "probe_http_status_code{${local.probe_f}}" },
        { title = "Expiration du certificat", unit = "s", legend = local.ctr_legend,
        expr = "probe_ssl_earliest_cert_expiry{${local.probe_f}} - time()" },
      ]
    }
  }
}

resource "grafana_folder" "tet" {
  title = "TeT"
}

resource "grafana_dashboard" "this" {
  for_each = local.dashboards

  folder = grafana_folder.tet.uid
  config_json = jsonencode({
    uid     = "tet-${each.key}"
    title   = each.value.title
    tags    = ["tet"]
    time    = { from = "now-24h", to = "now" }
    refresh = "1m"

    templating = {
      list = [
        for v in concat([{ name = "server", query = "label_values(up, server)" }], each.value.vars) : {
          name       = v.name
          type       = "query"
          datasource = local.ds
          query      = { query = v.query, refId = v.name }
          refresh    = 2
          multi      = true
          includeAll = true
          current    = { text = "All", value = "$__all" }
        }
      ]
    }

    panels = [
      for i, p in each.value.panels : {
        id          = i + 1
        type        = "timeseries"
        title       = p.title
        datasource  = local.ds
        gridPos     = { h = 8, w = 12, x = (i % 2) * 12, y = floor(i / 2) * 8 }
        fieldConfig = { defaults = { unit = p.unit }, overrides = [] }
        targets = [
          { refId = "A", datasource = local.ds, expr = p.expr, legendFormat = p.legend }
        ]
      }
    ]
  })
}
