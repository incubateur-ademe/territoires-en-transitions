#!/usr/bin/env bash
# Monte des fichiers locaux dans un conteneur d'un service Coolify (file
# storages), créés ou mis à jour par l'API.
#
# Invoqué par terraform_data.supabase_api_templates (infra/coolify/services.tf).
# Pourquoi pas la clé `content:` du compose : Coolify l'extrait du compose qu'il
# stocke, le provider voit alors un compose différent de celui envoyé
# (« inconsistent result after apply »). Et un file storage issu du compose est
# en lecture seule pour l'API ; un file storage créé par l'API ne l'est pas.
#
# Idempotent : POST si le point de montage n'existe pas, PATCH sinon. Effectif
# au prochain redémarrage du service.
#
# Variables attendues :
#   COOLIFY_ENDPOINT   URL de base (…/api/v1)
#   COOLIFY_TOKEN      token Bearer (via scripts/coolify-env.sh)
#   SERVICE_UUID       UUID du service Coolify
#   SUB_RESOURCE       nom du conteneur dans le compose, ex. gotrue
#   FILES_DIR          dossier local des fichiers à monter
#   MOUNT_DIR          dossier de montage dans le conteneur
#   FILES_GLOB         (optionnel) motif des fichiers, défaut *
set -euo pipefail

: "${COOLIFY_ENDPOINT:?COOLIFY_ENDPOINT non défini (ex: https://.../api/v1)}"
: "${COOLIFY_TOKEN:?COOLIFY_TOKEN non défini — source infra/scripts/coolify-env.sh}"
: "${SERVICE_UUID:?SERVICE_UUID non défini}"
: "${SUB_RESOURCE:?SUB_RESOURCE non défini (ex: gotrue)}"
: "${FILES_DIR:?FILES_DIR non défini}"
: "${MOUNT_DIR:?MOUNT_DIR non défini (ex: /etc/gotrue/templates)}"

umask 077
_tmp="$(mktemp -d)"
trap 'rm -rf "$_tmp"' EXIT
printf 'Authorization: Bearer %s\nAccept: application/json\n' "$COOLIFY_TOKEN" >"$_tmp/headers"

api() { # api <méthode> <chemin> [fichier corps]
  local _args=(-sS -o "$_tmp/body" -w '%{http_code}' -X "$1" -H "@$_tmp/headers")
  [ -n "${3:-}" ] && _args+=(-H "Content-Type: application/json" --data-binary "@$3")
  local _code
  _code="$(curl "${_args[@]}" "${COOLIFY_ENDPOINT}$2")"
  if [ "${_code:0:1}" != "2" ]; then
    echo "✗ $1 $2 → HTTP ${_code}" >&2
    jq -r '.message // empty, (.errors // {} | to_entries[] | "  \(.key) : \(.value)")' \
      "$_tmp/body" >&2 2>/dev/null || true
    exit 1
  fi
  cat "$_tmp/body"
}

resource_uuid="$(api GET "/services/${SERVICE_UUID}" | jq -r --arg n "$SUB_RESOURCE" \
  '[.applications[]?, .databases[]? | select(.name == $n)] | first | .uuid // empty')"
if [ -z "$resource_uuid" ]; then
  echo "✗ Pas de conteneur « ${SUB_RESOURCE} » dans le service ${SERVICE_UUID}." >&2
  exit 1
fi

api GET "/services/${SERVICE_UUID}/storages" >"$_tmp/storages.json"

shopt -s nullglob
_files=("${FILES_DIR}"/${FILES_GLOB:-*})
[ "${#_files[@]}" -gt 0 ] || {
  echo "✗ Aucun fichier dans ${FILES_DIR}." >&2
  exit 1
}

for _f in "${_files[@]}"; do
  _mount="${MOUNT_DIR%/}/$(basename "$_f")"
  _uuid="$(jq -r --arg m "$_mount" --arg r "$resource_uuid" \
    '[.file_storages[]? | select(.mount_path == $m and .resource_uuid == $r)] | first | .uuid // empty' \
    "$_tmp/storages.json")"
  if [ -n "$_uuid" ]; then
    jq -n --arg u "$_uuid" --rawfile c "$_f" '{uuid: $u, type: "file", content: $c}' >"$_tmp/payload.json"
    api PATCH "/services/${SERVICE_UUID}/storages" "$_tmp/payload.json" >/dev/null
    echo "  ~ ${_mount}"
  else
    jq -n --arg r "$resource_uuid" --arg m "$_mount" --rawfile c "$_f" \
      '{type: "file", resource_uuid: $r, mount_path: $m, content: $c}' >"$_tmp/payload.json"
    api POST "/services/${SERVICE_UUID}/storages" "$_tmp/payload.json" >/dev/null
    echo "  + ${_mount}"
  fi
done

echo "✓ ${#_files[@]} fichier(s) monté(s) dans ${SUB_RESOURCE}:${MOUNT_DIR}. Effectif au prochain redémarrage."
