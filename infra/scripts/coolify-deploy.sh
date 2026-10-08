#!/usr/bin/env bash
# Déploie une version d'image d'une application Coolify et attend l'issue.
#
# Remplace `koyeb services update` dans la CD. Utilisable aussi à la main.
# L'application est retrouvée par le marqueur [tet-app:<APP_ID>] posé par
# coolify-upsert-application.sh : la CD n'a besoin d'aucun UUID.
#
# C'est la CD qui possède la version : elle pose le tag par PATCH puis
# déclenche le déploiement. Terraform n'y touche qu'à la création. Le paramètre
# docker_tag de POST /deploy ne sert pas ici : Coolify ne l'honore que pour les
# déploiements de preview (avec pull_request_id).
#
# Variables attendues :
#   COOLIFY_ENDPOINT   URL de base (…/api/v1)
#   COOLIFY_TOKEN      token Bearer. En CI : un token « write » + « deploy »
#                      (le PATCH du tag exige write), jamais « root »
#   APP_ID             ex. preprod/app
#   IMAGE_TAG          tag de l'image à déployer, ex. le short SHA du commit
#   DEPLOY_TIMEOUT     (optionnel) secondes d'attente max, défaut 900
#
# Code de sortie non nul si le déploiement échoue, est annulé ou dépasse le
# délai : le job de CD échoue avec lui.
set -euo pipefail

: "${COOLIFY_ENDPOINT:?COOLIFY_ENDPOINT non défini (ex: https://.../api/v1)}"
: "${COOLIFY_TOKEN:?COOLIFY_TOKEN non défini}"
: "${APP_ID:?APP_ID non défini (ex: preprod/app)}"
: "${IMAGE_TAG:?IMAGE_TAG non défini}"

case "$-" in *x*)
  echo "✗ Refus de tourner en mode trace (set -x) : le token apparaîtrait dans les logs." >&2
  exit 1
  ;;
esac

_timeout="${DEPLOY_TIMEOUT:-900}"
_marker="[tet-app:${APP_ID}]"

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
    jq -r '.message // empty' "$_tmp/body" >&2 2>/dev/null || cat "$_tmp/body" >&2
    exit 1
  fi
  cat "$_tmp/body"
}

app_uuid="$(api GET /applications | jq -r --arg m "$_marker" \
  '[.[] | select((.description // "") | contains($m))] | first | .uuid // empty')"
if [ -z "$app_uuid" ]; then
  echo "✗ Aucune application ne porte ${_marker}. Est-elle déclarée dans infra/coolify/applications.tf ?" >&2
  exit 1
fi

echo "→ Déploiement de ${APP_ID} (uuid=${app_uuid}) en ${IMAGE_TAG}…"
jq -n --arg tag "$IMAGE_TAG" '{docker_registry_image_tag: $tag}' >"$_tmp/tag.json"
api PATCH "/applications/${app_uuid}" "$_tmp/tag.json" >/dev/null
deployment_uuid="$(api POST "/deploy?uuid=${app_uuid}&force=false" \
  | jq -r '.deployments[0].deployment_uuid // empty')"
if [ -z "$deployment_uuid" ]; then
  echo "✗ Coolify n'a mis aucun déploiement en file." >&2
  exit 1
fi
echo "  déploiement ${deployment_uuid} en file"

_start="$(date +%s)"
_last=""
while :; do
  status="$(api GET "/deployments/${deployment_uuid}" | jq -r '.status // empty')"
  [ "$status" != "$_last" ] && echo "  statut : ${status}" && _last="$status"
  case "$status" in
  finished)
    echo "✓ ${APP_ID} déployée en ${IMAGE_TAG}."
    exit 0
    ;;
  failed | cancelled-by-user | cancelled)
    echo "✗ Déploiement ${status}. Logs : Coolify → ${APP_ID} → Deployments → ${deployment_uuid}" >&2
    exit 1
    ;;
  esac
  if [ $(($(date +%s) - _start)) -ge "$_timeout" ]; then
    echo "✗ Délai de ${_timeout}s dépassé (statut : ${status})." >&2
    exit 1
  fi
  sleep 10
done
