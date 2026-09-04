#!/usr/bin/env bash
# Assigne la clé host au serveur localhost de Coolify et déclenche sa validation.
#
# Invoqué par terraform_data.assign_host_key (infra/coolify-preprod/main.tf), ou
# manuellement. Idempotent : PATCH /servers/{uuid} peut être rejoué sans effet
# de bord. Utilise l'API REST (endpoints vérifiés dans openapi.yaml) plutôt que
# la ressource coolify_server du provider, marquée « not fully implemented ».
#
# Variables attendues :
#   COOLIFY_ENDPOINT  URL de base (…/api/v1)
#   COOLIFY_TOKEN     token Bearer (via scripts/coolify-env.sh)
#   HOST_KEY_UUID     UUID de la clé privée à assigner
set -euo pipefail

: "${COOLIFY_ENDPOINT:?COOLIFY_ENDPOINT non défini (ex: https://.../api/v1)}"
: "${COOLIFY_TOKEN:?COOLIFY_TOKEN non défini — source infra/scripts/coolify-env.sh}"
: "${HOST_KEY_UUID:?HOST_KEY_UUID non défini}"

for bin in curl jq; do
  command -v "$bin" >/dev/null 2>&1 || {
    echo "✗ '$bin' requis mais introuvable." >&2
    exit 1
  }
done

auth=(-H "Authorization: Bearer ${COOLIFY_TOKEN}" -H "Accept: application/json")

echo "→ Recherche du serveur localhost sur ${COOLIFY_ENDPOINT}…"
servers="$(curl -fsS "${auth[@]}" "${COOLIFY_ENDPOINT}/servers")"
srv_uuid="$(printf '%s' "$servers" | jq -r '
  .[] | select(
    (.ip // .ip_address) == "host.docker.internal" or .name == "localhost"
  ) | .uuid' | head -n1)"

if [ -z "$srv_uuid" ] || [ "$srv_uuid" = "null" ]; then
  echo "✗ Serveur localhost introuvable. Serveurs disponibles :" >&2
  printf '%s' "$servers" | jq -r '.[] | "  - \(.name) (\(.uuid))"' >&2
  exit 1
fi
echo "  localhost uuid=$srv_uuid"

echo "→ Assignation de la clé ${HOST_KEY_UUID} + validation…"
curl -fsS -X PATCH "${auth[@]}" -H "Content-Type: application/json" \
  "${COOLIFY_ENDPOINT}/servers/${srv_uuid}" \
  -d "{\"private_key_uuid\":\"${HOST_KEY_UUID}\",\"instant_validate\":true}" >/dev/null

echo "✓ Clé assignée au serveur localhost, validation déclenchée."
