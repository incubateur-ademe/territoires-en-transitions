#!/usr/bin/env bash
# Retire un serveur applicatif de Coolify.
#
# Invoqué au destroy de terraform_data.server_registration (infra/coolify),
# c'est-à-dire quand un tier est retiré de app_servers. Sans ça, le serveur
# restait enregistré dans Coolify, avec la clé root qui permet de le piloter.
#
# Ne force jamais : Coolify refuse de supprimer un serveur qui héberge encore
# des ressources (applications, bases, services), et c'est voulu. L'apply
# échoue alors, et le serveur reste dans le state tant que ses ressources n'ont
# pas été déplacées ou supprimées dans Coolify.
#
# Seul le serveur est retiré de Coolify : la machine, Docker et les fichiers
# restent. La clé privée est supprimée ensuite par Terraform
# (coolify_private_key), une fois qu'aucun serveur ne l'utilise plus.
#
# Idempotent : un serveur déjà absent n'est pas une erreur.
#
# Variables attendues :
#   COOLIFY_ENDPOINT  URL de base (…/api/v1)
#   COOLIFY_TOKEN     token Bearer (via scripts/coolify-env.sh)
#   SERVER_ID         identifiant stable du serveur (marqueur [tet-server:<id>])
#   SERVER_NAME       nom du serveur, repli pour un serveur sans marqueur
set -euo pipefail

: "${COOLIFY_ENDPOINT:?COOLIFY_ENDPOINT non défini (ex: https://.../api/v1)}"
: "${COOLIFY_TOKEN:?COOLIFY_TOKEN non défini — source infra/scripts/coolify-env.sh}"
: "${SERVER_ID:?SERVER_ID non défini}"
: "${SERVER_NAME:?SERVER_NAME non défini}"

for bin in curl jq; do
  command -v "$bin" >/dev/null 2>&1 || {
    echo "✗ '$bin' requis mais introuvable." >&2
    exit 1
  }
done

auth=(-H "Authorization: Bearer ${COOLIFY_TOKEN}" -H "Accept: application/json")
_marker="[tet-server:${SERVER_ID}]"

servers="$(curl -fsS "${auth[@]}" "${COOLIFY_ENDPOINT}/servers")"
srv_uuid="$(printf '%s' "$servers" | jq -r --arg m "$_marker" --arg n "$SERVER_NAME" '
  ([.[] | select((.description // "") | contains($m))] +
   [.[] | select((.description // "") | test("\\[tet-server:") | not)
        | select(.name == $n)])
  | first | .uuid // empty')"

if [ -z "$srv_uuid" ]; then
  echo "✓ Serveur ${_marker} (« ${SERVER_NAME} ») absent de Coolify : rien à retirer."
  exit 0
fi

echo "→ Retrait du serveur « ${SERVER_NAME} » (uuid=${srv_uuid}) de Coolify…"
_body="$(mktemp)"
trap 'rm -f "$_body"' EXIT
_status="$(curl -sS -o "$_body" -w '%{http_code}' -X DELETE "${auth[@]}" \
  "${COOLIFY_ENDPOINT}/servers/${srv_uuid}")"

case "$_status" in
  2??)
    echo "✓ Serveur « ${SERVER_NAME} » retiré de Coolify."
    ;;
  404)
    echo "✓ Serveur « ${SERVER_NAME} » déjà retiré."
    ;;
  *)
    echo "✗ Coolify refuse de retirer « ${SERVER_NAME} » (HTTP ${_status}) :" >&2
    jq -r '.message // .' "$_body" >&2 2>/dev/null || cat "$_body" >&2
    echo "  S'il héberge encore des ressources, les déplacer ou les supprimer dans" >&2
    echo "  Coolify, puis relancer l'apply." >&2
    exit 1
    ;;
esac
