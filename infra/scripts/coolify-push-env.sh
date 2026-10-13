#!/usr/bin/env bash
# Pousse les variables d'environnement d'une application Coolify depuis un
# manifeste, en lisant les valeurs secrètes dans Scaleway Secret Manager.
#
# Invoqué par terraform_data.env_push (infra/coolify/env-push.tf), ou
# manuellement. Idempotent : n'écrit que ce qui diffère.
#
# Le manifeste ne contient AUCUNE valeur secrète, seulement des noms de
# secrets : il apparaît dans le plan Terraform, et c'est voulu, c'est le diff
# qu'on relit. Les valeurs sont résolues ici, à l'apply, et ne passent jamais
# par le state.
#
# Deux phases :
#   1. résolution de toutes les valeurs, sans rien écrire. Un secret absent ou
#      sans version fait échouer le script avant toute écriture, avec la liste
#      complète de ce qui manque : pas d'application à moitié configurée, ce
#      qui compte puisqu'une clé manquante fait crash-looper app et backend ;
#   2. réconciliation : POST si la clé manque, PATCH si la valeur diffère,
#      rien sinon. Avec PRUNE=true, les clés absentes du manifeste sont
#      supprimées : le manifeste fait autorité, une variable posée à la main
#      dans l'UI est une dérive.
#
# Variables attendues :
#   COOLIFY_ENDPOINT    URL de base (…/api/v1)
#   COOLIFY_TOKEN       token Bearer (via scripts/coolify-env.sh)
#   APP_ID              ex. preprod/backend ; marqueur [tet-app:<APP_ID>]
#   SECRET_PROJECT_ID   projet Scaleway des secrets de l'environnement
#   SECRET_PATH         path Secret Manager, ex. /coolify-env/preprod
#   ENV_MANIFEST        JSON : [{key, value?, secret?, multiline}], secret = nom
#                       complet du secret Scaleway
#   PRUNE               (optionnel) true pour supprimer les clés hors manifeste
#   DRY_RUN             (optionnel) true pour s'arrêter après la résolution
set -euo pipefail

: "${COOLIFY_ENDPOINT:?COOLIFY_ENDPOINT non défini (ex: https://.../api/v1)}"
: "${COOLIFY_TOKEN:?COOLIFY_TOKEN non défini — source infra/scripts/coolify-env.sh}"
: "${APP_ID:?APP_ID non défini (ex: preprod/backend)}"
: "${SECRET_PROJECT_ID:?SECRET_PROJECT_ID non défini}"
: "${SECRET_PATH:?SECRET_PATH non défini (ex: /coolify-env/preprod)}"
: "${ENV_MANIFEST:?ENV_MANIFEST non défini}"

case "$-" in *x*)
  echo "✗ Refus de tourner en mode trace (set -x) : les valeurs secrètes apparaîtraient dans les logs." >&2
  exit 1
  ;;
esac

for bin in curl jq scw base64; do
  command -v "$bin" >/dev/null 2>&1 || {
    echo "✗ '$bin' requis mais introuvable." >&2
    exit 1
  }
done

_marker="[tet-app:${APP_ID}]"
_prune="${PRUNE:-false}"

umask 077
_tmp="$(mktemp -d)"
trap 'rm -rf "$_tmp"' EXIT
mkdir "$_tmp/values"
printf 'Authorization: Bearer %s\nAccept: application/json\n' "$COOLIFY_TOKEN" >"$_tmp/headers"

api() { # api <méthode> <chemin> [fichier corps]
  local _args=(-sS -o "$_tmp/body" -w '%{http_code}' -X "$1" -H "@$_tmp/headers")
  [ -n "${3:-}" ] && _args+=(-H "Content-Type: application/json" --data-binary "@$3")
  local _code
  _code="$(curl "${_args[@]}" "${COOLIFY_ENDPOINT}$2")"
  if [ "${_code:0:1}" != "2" ]; then
    # Jamais le corps brut ni les valeurs d'erreur : ils peuvent citer la
    # valeur envoyée. Le message et les noms de champs suffisent.
    echo "✗ $1 $2 → HTTP ${_code}" >&2
    jq -r '.message // empty, (.errors // {} | keys[] | "  champ en erreur : \(.)")' \
      "$_tmp/body" >&2 2>/dev/null || true
    exit 1
  fi
  cat "$_tmp/body"
}

printf '%s' "$ENV_MANIFEST" >"$_tmp/manifest.json"
jq -e 'type == "array" and all(.[]; (.key | type == "string")
  and ((has("value")) != (has("secret"))))' "$_tmp/manifest.json" >/dev/null || {
  echo "✗ ENV_MANIFEST invalide : chaque entrée porte une key et exactement un de value / secret." >&2
  exit 1
}

# --- Phase 1 : résolution, aucune écriture ---

echo "→ ${APP_ID} : résolution de $(jq length "$_tmp/manifest.json") variables…"

app_uuid="$(api GET /applications | jq -r --arg m "$_marker" \
  '[.[] | select((.description // "") | contains($m))] | first | .uuid // empty')"
if [ -z "$app_uuid" ]; then
  echo "✗ Aucune application ne porte ${_marker}. Appliquer d'abord infra/coolify (applications.tf)." >&2
  exit 1
fi

_missing=()
while IFS=$'\t' read -r _key _kind _ref; do
  _out="$_tmp/values/$_key"
  if [ "$_kind" = "value" ]; then
    jq -j --arg k "$_key" '.[] | select(.key == $k) | .value' "$_tmp/manifest.json" >"$_out"
    continue
  fi
  # .data est en base64 : décodé directement dans le fichier, les octets
  # (retours à la ligne finaux compris) sont préservés.
  if scw secret version access-by-path secret-name="$_ref" secret-path="$SECRET_PATH" \
    revision=latest project-id="$SECRET_PROJECT_ID" -o json 2>"$_tmp/scw.err" \
    | jq -r '.data' | base64 --decode >"$_out" 2>/dev/null && [ -s "$_out" ]; then
    continue
  fi
  if grep -qi 'version' "$_tmp/scw.err"; then
    _missing+=("${_key} ← ${_ref} (secret sans version)")
  else
    _missing+=("${_key} ← ${_ref} (secret absent ou illisible)")
  fi
done < <(jq -r '.[] | [.key, (if has("secret") then "secret" else "value" end),
  (.secret // "")] | @tsv' "$_tmp/manifest.json")

if [ "${#_missing[@]}" -gt 0 ]; then
  echo "✗ ${#_missing[@]} valeur(s) introuvable(s) dans ${SECRET_PATH} — rien n'a été écrit :" >&2
  printf '  - %s\n' "${_missing[@]}" >&2
  echo "  Déposer une valeur : infra/scripts/coolify-env-secret-set.sh <env> <nom-court> < fichier" >&2
  exit 1
fi

if [ "${DRY_RUN:-false}" = "true" ]; then
  echo "✓ ${APP_ID} : toutes les valeurs sont résolues (DRY_RUN, rien n'est écrit)."
  exit 0
fi

# --- Phase 2 : réconciliation ---

api GET "/applications/${app_uuid}/envs" \
  | jq '[.[] | select(.is_preview == false)]' >"$_tmp/current.json"

_created=0 _updated=0 _unchanged=0 _deleted=0
while IFS=$'\t' read -r _key _multiline; do
  jq -n --arg k "$_key" --rawfile v "$_tmp/values/$_key" --argjson ml "$_multiline" \
    '{key: $k, value: $v, is_literal: true, is_multiline: $ml, is_preview: false,
      is_shown_once: false}' >"$_tmp/payload.json"

  _state="$(jq -r --arg k "$_key" --rawfile v "$_tmp/values/$_key" --argjson ml "$_multiline" '
    [.[] | select(.key == $k)] | first
    | if . == null then "absent"
      elif .value == $v and (.is_multiline // false) == $ml and (.is_literal // false)
        then "identique"
      else "different" end' "$_tmp/current.json")"

  case "$_state" in
  absent)
    api POST "/applications/${app_uuid}/envs" "$_tmp/payload.json" >/dev/null
    echo "  + ${_key}"
    _created=$((_created + 1))
    ;;
  different)
    api PATCH "/applications/${app_uuid}/envs" "$_tmp/payload.json" >/dev/null
    echo "  ~ ${_key}"
    _updated=$((_updated + 1))
    ;;
  *) _unchanged=$((_unchanged + 1)) ;;
  esac
done < <(jq -r '.[] | [.key, (.multiline // false | tostring)] | @tsv' "$_tmp/manifest.json")

while IFS=$'\t' read -r _key _uuid; do
  if [ "$_prune" = "true" ]; then
    api DELETE "/applications/${app_uuid}/envs/${_uuid}" >/dev/null
    echo "  - ${_key} (hors manifeste, supprimée)"
    _deleted=$((_deleted + 1))
  else
    echo "  ! ${_key} : hors manifeste, conservée (PRUNE=false)"
  fi
done < <(jq -r --slurpfile m "$_tmp/manifest.json" '
  ($m[0] | map(.key)) as $keys
  | .[] | select(.key as $k | $keys | index($k) | not) | [.key, .uuid] | @tsv' \
  "$_tmp/current.json")

echo "✓ ${APP_ID} : ${_created} créée(s), ${_updated} mise(s) à jour, ${_unchanged} inchangée(s), ${_deleted} supprimée(s)."
if [ $((_created + _updated + _deleted)) -gt 0 ]; then
  echo "  Effectif au prochain déploiement de ${APP_ID}."
fi
