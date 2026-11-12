#!/usr/bin/env bash
# Pousse les règles d'alerte de infra/observability/rules dans le Cockpit du
# stack courant (API Mimir des règles). À lancer depuis infra/nonprod ou
# infra/prod, via `make cockpit-rules` : l'URL vient de `terraform output`.
#
# Un groupe par fichier, tous dans le namespace « tet ». Un POST remplace le
# groupe du même nom : le script est idempotent. Un fichier supprimé laisse son
# groupe en place : le retirer à la main (DELETE …/rules/tet/<groupe>).
# Authentification : clé IAM de l'opérateur (scw config), pas un token Cockpit.
set -euo pipefail

url=$(terraform output -raw cockpit_metrics_url)
key=${SCW_SECRET_KEY:-$(scw config get secret-key)}

for f in "$(dirname "$0")"/../observability/rules/*.yaml; do
  code=$(curl -sS -o /dev/stderr -w '%{http_code}' -X POST \
    -H "X-Auth-Token: $key" -H "Content-Type: application/yaml" \
    --data-binary "@$f" "$url/prometheus/config/v1/rules/tet")
  [ "${code:0:1}" = 2 ] || { echo "✗ $f → HTTP $code" >&2; exit 1; }
  echo "✓ $f"
done
