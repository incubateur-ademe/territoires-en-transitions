#!/usr/bin/env bash
# Déclare une application « image Docker » dans Coolify (création ou mise à
# jour), sans la déployer.
#
# Invoqué par terraform_data.application (infra/coolify/applications.tf), ou
# manuellement. Idempotent : POST /applications/dockerimage si absente,
# PATCH /applications/{uuid} sinon.
#
# Le provider sierrajc/coolify n'a pas de ressource coolify_application (une
# data source seulement) : on passe par l'API REST, comme pour les serveurs.
#
# Partage des responsabilités avec la CD :
#   - Terraform possède la *forme* de l'application : image, domaines, port,
#     healthcheck, limites ;
#   - la CD possède la *version* : le tag d'image, posé par
#     POST /deploy?docker_tag=… (scripts/coolify-deploy.sh).
# Le tag n'est donc envoyé qu'à la création (APP_INITIAL_TAG), jamais au PATCH :
# un apply ne doit pas faire revenir l'application à une version antérieure.
#
# L'application est retrouvée par le marqueur [tet-app:<APP_ID>] de sa
# description, jamais par son nom : les projets Coolify ont chacun leur « app »
# et leur « backend ». Le serveur l'est par le marqueur [tet-server:<tier>] posé
# par coolify-upsert-server.sh.
#
# Variables attendues :
#   COOLIFY_ENDPOINT       URL de base (…/api/v1)
#   COOLIFY_TOKEN          token Bearer (via scripts/coolify-env.sh)
#   APP_ID                 identifiant stable, ex. preprod/app ; porté par le marqueur
#   APP_NAME               nom affiché dans Coolify
#   APP_DESCRIPTION        (optionnel) description affichée dans l'UI
#   PROJECT_UUID           projet Coolify de l'environnement
#   ENVIRONMENT_NAME       (optionnel) environnement du projet, défaut production
#   SERVER_TIER            tier du serveur cible (nonprod, prod, preview)
#   APP_IMAGE              image sans tag, ex. ghcr.io/incubateur-ademe/tet-app
#   APP_INITIAL_TAG        tag posé à la création seulement
#   APP_PORT               port exposé par le conteneur
#   APP_DOMAINS            URLs servies, séparées par des virgules (https://…)
#   APP_REDIRECT           (optionnel) www | non-www | both, défaut both
#   APP_HEALTH_PATH        (optionnel) chemin du healthcheck HTTP Coolify ; vide =
#                          healthcheck Coolify désactivé (celui de l'image prime)
#   APP_LIMITS_MEMORY      (optionnel) ex. 1g ; défaut 0 (pas de limite)
set -euo pipefail

: "${COOLIFY_ENDPOINT:?COOLIFY_ENDPOINT non défini (ex: https://.../api/v1)}"
: "${COOLIFY_TOKEN:?COOLIFY_TOKEN non défini — source infra/scripts/coolify-env.sh}"
: "${APP_ID:?APP_ID non défini}"
: "${APP_NAME:?APP_NAME non défini}"
: "${PROJECT_UUID:?PROJECT_UUID non défini}"
: "${SERVER_TIER:?SERVER_TIER non défini}"
: "${APP_IMAGE:?APP_IMAGE non défini}"
: "${APP_INITIAL_TAG:?APP_INITIAL_TAG non défini}"
: "${APP_PORT:?APP_PORT non défini}"
: "${APP_DOMAINS:?APP_DOMAINS non défini}"

case "$-" in *x*)
  echo "✗ Refus de tourner en mode trace (set -x) : le token apparaîtrait dans les logs." >&2
  exit 1
  ;;
esac

for bin in curl jq; do
  command -v "$bin" >/dev/null 2>&1 || {
    echo "✗ '$bin' requis mais introuvable." >&2
    exit 1
  }
done

_env_name="${ENVIRONMENT_NAME:-production}"
_marker="[tet-app:${APP_ID}]"
_description="${APP_DESCRIPTION:-Géré par Terraform (infra/coolify).} ${_marker}"

# Token et corps de requête passés à curl par fichier, jamais en argv : ils
# n'apparaissent pas dans `ps`.
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
    jq -r '.message // empty, (.errors // {} | to_entries[] | "  \(.key) : \(.value | join(", "))")' \
      "$_tmp/body" >&2 2>/dev/null || cat "$_tmp/body" >&2
    exit 1
  fi
  cat "$_tmp/body"
}

echo "→ ${APP_ID} : résolution du serveur et de l'environnement…"

server_uuid="$(api GET /servers | jq -r --arg m "[tet-server:${SERVER_TIER}]" \
  '[.[] | select((.description // "") | contains($m))] | first | .uuid // empty')"
if [ -z "$server_uuid" ]; then
  echo "✗ Aucun serveur ne porte le marqueur [tet-server:${SERVER_TIER}]." >&2
  echo "  Appliquer d'abord terraform_data.server (infra/coolify/main.tf)." >&2
  exit 1
fi

environment_uuid="$(api GET "/projects/${PROJECT_UUID}/environments" \
  | jq -r --arg n "$_env_name" '.[] | select(.name == $n) | .uuid' | head -n1)"
if [ -z "$environment_uuid" ]; then
  echo "✗ Environnement « ${_env_name} » introuvable dans le projet ${PROJECT_UUID}." >&2
  exit 1
fi

app_uuid="$(api GET /applications | jq -r --arg m "$_marker" \
  '[.[] | select((.description // "") | contains($m))] | first | .uuid // empty')"

# Champs possédés par Terraform, communs à la création et à la mise à jour.
#
# health_check_* : l'image app porte un HEALTHCHECK Docker, que Coolify préfère
# à son propre check. Pour les autres, un check HTTP Coolify sur APP_HEALTH_PATH
# conditionne la bascule de trafic au déploiement.
jq -n \
  --arg name "$APP_NAME" \
  --arg desc "$_description" \
  --arg image "$APP_IMAGE" \
  --arg port "$APP_PORT" \
  --arg domains "$APP_DOMAINS" \
  --arg redirect "${APP_REDIRECT:-both}" \
  --arg health "${APP_HEALTH_PATH:-}" \
  --arg mem "${APP_LIMITS_MEMORY:-0}" \
  '{
    name: $name,
    description: $desc,
    docker_registry_image_name: $image,
    ports_exposes: $port,
    domains: $domains,
    redirect: $redirect,
    is_force_https_enabled: true,
    health_check_enabled: ($health != ""),
    health_check_path: (if $health == "" then "/" else $health end),
    health_check_port: $port,
    limits_memory: $mem
  }' >"$_tmp/fields.json"

if [ -n "$app_uuid" ]; then
  echo "  application existante uuid=${app_uuid} → mise à jour (tag inchangé)"
  api PATCH "/applications/${app_uuid}" "$_tmp/fields.json" >/dev/null
  echo "✓ ${APP_ID} mise à jour. Effective au prochain déploiement."
else
  echo "  aucune application ne porte ${_marker} → création, sans déploiement"
  jq \
    --arg project "$PROJECT_UUID" \
    --arg server "$server_uuid" \
    --arg env_name "$_env_name" \
    --arg env_uuid "$environment_uuid" \
    --arg tag "$APP_INITIAL_TAG" \
    '. + {
      project_uuid: $project,
      server_uuid: $server,
      environment_name: $env_name,
      environment_uuid: $env_uuid,
      docker_registry_image_tag: $tag,
      instant_deploy: false
    }' "$_tmp/fields.json" >"$_tmp/create.json"
  new_uuid="$(api POST /applications/dockerimage "$_tmp/create.json" | jq -r '.uuid // empty')"
  if [ -z "$new_uuid" ]; then
    echo "✗ Création acceptée mais aucun uuid renvoyé." >&2
    exit 1
  fi
  echo "✓ ${APP_ID} créée (uuid=${new_uuid}). Rien n'est déployé tant que ses variables ne sont pas poussées."
fi
