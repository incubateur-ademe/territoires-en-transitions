#!/usr/bin/env bash
# Enregistre (ou met à jour) un S3 storage Scaleway dans Coolify, puis le valide.
#
# Invoqué par terraform_data.s3_storage (infra/coolify-preprod/main.tf), ou
# manuellement. Idempotent : GET /s3-storages par name → POST ou PATCH, puis
# POST /s3-storages/{uuid}/validate (ListObjectsV2 sur le bucket).
#
# Les credentials Object Storage restent hors state Terraform : lecture à
# l'apply via `scw` (même posture que GHCR / R4). Format du secret :
#   <SCW_ACCESS_KEY>|<SCW_SECRET_KEY>
#
# Variables attendues :
#   COOLIFY_ENDPOINT          URL de base (…/api/v1)
#   COOLIFY_TOKEN             token Bearer (via scripts/coolify-env.sh)
#   S3_STORAGE_NAME           nom affiché dans Coolify (clé d'idempotence)
#   S3_ENDPOINT               ex. https://s3.fr-par.scw.cloud
#   S3_BUCKET                 nom du bucket Scaleway
#   S3_REGION                 ex. fr-par
#   S3_CREDENTIALS_SECRET_NAME  secret SM access_key|secret_key
#   S3_DESCRIPTION            (optionnel) description Coolify
set -euo pipefail

: "${COOLIFY_ENDPOINT:?COOLIFY_ENDPOINT non défini (ex: https://.../api/v1)}"
: "${COOLIFY_TOKEN:?COOLIFY_TOKEN non défini — source infra/scripts/coolify-env.sh}"
: "${S3_STORAGE_NAME:?S3_STORAGE_NAME non défini}"
: "${S3_ENDPOINT:?S3_ENDPOINT non défini}"
: "${S3_BUCKET:?S3_BUCKET non défini}"
: "${S3_REGION:?S3_REGION non défini}"
: "${S3_CREDENTIALS_SECRET_NAME:?S3_CREDENTIALS_SECRET_NAME non défini}"

_DESCRIPTION="${S3_DESCRIPTION:-Scaleway Object Storage géré par Terraform (infra/coolify-preprod).}"

for bin in curl jq scw; do
  command -v "$bin" >/dev/null 2>&1 || {
    echo "✗ '$bin' requis mais introuvable." >&2
    exit 1
  }
done

echo "→ Lecture des credentials Object Storage (${S3_CREDENTIALS_SECRET_NAME})…"
_creds_raw="$(scw secret version access-by-path \
  secret-name="${S3_CREDENTIALS_SECRET_NAME}" secret-path=/ revision=latest \
  --output=json | jq -r '.data // empty' | base64 --decode)"
_s3_key="${_creds_raw%%|*}"
_s3_secret="${_creds_raw#*|}"
if [ -z "${_s3_key}" ] || [ -z "${_s3_secret}" ] || [ "${_s3_key}" = "${_creds_raw}" ]; then
  echo "✗ Secret S3 mal formé. Attendu : <access_key>|<secret_key>" >&2
  echo "  scw secret version create secret-name=${S3_CREDENTIALS_SECRET_NAME} secret-path=/ data='SCWXXXX|<secret>'" >&2
  exit 1
fi

auth=(-H "Authorization: Bearer ${COOLIFY_TOKEN}" -H "Accept: application/json" -H "Content-Type: application/json")

_payload="$(jq -n \
  --arg name "${S3_STORAGE_NAME}" \
  --arg description "${_DESCRIPTION}" \
  --arg endpoint "${S3_ENDPOINT}" \
  --arg bucket "${S3_BUCKET}" \
  --arg region "${S3_REGION}" \
  --arg key "${_s3_key}" \
  --arg secret "${_s3_secret}" \
  '{
    name: $name,
    description: $description,
    endpoint: $endpoint,
    bucket: $bucket,
    region: $region,
    key: $key,
    secret: $secret
  }')"

echo "→ Recherche du S3 storage « ${S3_STORAGE_NAME} » sur ${COOLIFY_ENDPOINT}…"
_storages="$(curl -fsS "${auth[@]}" "${COOLIFY_ENDPOINT}/s3-storages")"
_uuid="$(printf '%s' "${_storages}" | jq -r --arg name "${S3_STORAGE_NAME}" '
  .[] | select(.name == $name) | .uuid' | head -n1)"

if [ -n "${_uuid}" ] && [ "${_uuid}" != "null" ]; then
  echo "  trouvé uuid=${_uuid} → PATCH…"
  curl -fsS -X PATCH "${auth[@]}" \
    "${COOLIFY_ENDPOINT}/s3-storages/${_uuid}" \
    -d "${_payload}" >/dev/null
else
  echo "  absent → POST…"
  _created="$(curl -fsS -X POST "${auth[@]}" \
    "${COOLIFY_ENDPOINT}/s3-storages" \
    -d "${_payload}")"
  _uuid="$(printf '%s' "${_created}" | jq -r '.uuid // empty')"
  if [ -z "${_uuid}" ] || [ "${_uuid}" = "null" ]; then
    echo "✗ Création S3 storage sans uuid. Réponse :" >&2
    printf '%s\n' "${_created}" >&2
    exit 1
  fi
  echo "  créé uuid=${_uuid}"
fi

echo "→ Validation (ListObjectsV2)…"
_validate="$(curl -fsS -X POST "${auth[@]}" \
  "${COOLIFY_ENDPOINT}/s3-storages/${_uuid}/validate")"
_valid="$(printf '%s' "${_validate}" | jq -r '.valid // empty')"
if [ "${_valid}" != "true" ]; then
  echo "✗ Validation S3 échouée :" >&2
  printf '%s\n' "${_validate}" | jq . >&2 2>/dev/null || printf '%s\n' "${_validate}" >&2
  exit 1
fi

echo "✓ S3 storage « ${S3_STORAGE_NAME} » configuré et validé (uuid=${_uuid})."
printf '%s\n' "${_uuid}"
