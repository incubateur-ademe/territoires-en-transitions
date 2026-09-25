#!/usr/bin/env bash
# Enregistre un serveur dans Coolify (création ou mise à jour) et déclenche sa
# validation.
#
# Invoqué par terraform_data.servers (infra/coolify/main.tf), ou manuellement.
# Idempotent : la recherche se fait par nom, puis POST /servers si absent,
# PATCH /servers/{uuid} sinon.
#
# Passe par l'API REST plutôt que par la ressource coolify_server du provider,
# marquée « not fully implemented » : un drift sur cette ressource détruirait
# le rattachement des projets déployés.
#
# Deux modes :
#
#   - serveur distant (défaut) : les serveurs applicatifs, joints par Coolify
#     sur leur IP privée. Créés s'ils n'existent pas.
#
#   - MATCH_LOCALHOST=true : le serveur que Coolify crée lui-même à l'install
#     pour piloter sa propre machine. Il existe forcément, on ne fait que lui
#     assigner la clé host maîtrisée par Terraform — celle que Coolify
#     régénère à chaque update, cassant la connexion.
#
# Variables attendues :
#   COOLIFY_ENDPOINT     URL de base (…/api/v1)
#   COOLIFY_TOKEN        token Bearer (via scripts/coolify-env.sh)
#   PRIVATE_KEY_UUID     UUID de la clé privée à assigner
#   SERVER_NAME          nom du serveur dans Coolify (clé d'idempotence)
#   SERVER_IP            IP SSH cible (ignorée si MATCH_LOCALHOST=true)
#   SERVER_USER          (optionnel) utilisateur SSH, défaut root
#   SERVER_PORT          (optionnel) port SSH, défaut 22
#   SERVER_DESCRIPTION   (optionnel) description affichée dans l'UI
#   MATCH_LOCALHOST      (optionnel) true pour cibler le serveur localhost
set -euo pipefail

: "${COOLIFY_ENDPOINT:?COOLIFY_ENDPOINT non défini (ex: https://.../api/v1)}"
: "${COOLIFY_TOKEN:?COOLIFY_TOKEN non défini — source infra/scripts/coolify-env.sh}"
: "${PRIVATE_KEY_UUID:?PRIVATE_KEY_UUID non défini}"
: "${SERVER_NAME:?SERVER_NAME non défini}"

_match_localhost="${MATCH_LOCALHOST:-false}"
_user="${SERVER_USER:-root}"
_port="${SERVER_PORT:-22}"
_description="${SERVER_DESCRIPTION:-Géré par Terraform (infra/coolify).}"

if [ "$_match_localhost" != "true" ]; then
  : "${SERVER_IP:?SERVER_IP non défini (requis hors MATCH_LOCALHOST)}"
fi

for bin in curl jq; do
  command -v "$bin" >/dev/null 2>&1 || {
    echo "✗ '$bin' requis mais introuvable." >&2
    exit 1
  }
done

auth=(-H "Authorization: Bearer ${COOLIFY_TOKEN}" -H "Accept: application/json")

echo "→ Inventaire des serveurs sur ${COOLIFY_ENDPOINT}…"
servers="$(curl -fsS "${auth[@]}" "${COOLIFY_ENDPOINT}/servers")"

if [ "$_match_localhost" = "true" ]; then
  # Coolify nomme ce serveur « localhost » et lui donne l'IP
  # host.docker.internal. Les deux critères sont testés : le nom est
  # modifiable dans l'UI, l'IP ne l'est pas.
  srv_uuid="$(printf '%s' "$servers" | jq -r '
    .[] | select(
      (.ip // .ip_address) == "host.docker.internal" or .name == "localhost"
    ) | .uuid' | head -n1)"

  if [ -z "$srv_uuid" ] || [ "$srv_uuid" = "null" ]; then
    echo "✗ Serveur localhost introuvable. Serveurs disponibles :" >&2
    printf '%s' "$servers" | jq -r '.[] | "  - \(.name) (\(.uuid))"' >&2
    exit 1
  fi
else
  srv_uuid="$(printf '%s' "$servers" | jq -r --arg n "$SERVER_NAME" '
    .[] | select(.name == $n) | .uuid' | head -n1)"
fi

if [ -n "$srv_uuid" ] && [ "$srv_uuid" != "null" ]; then
  echo "  serveur existant « ${SERVER_NAME} » uuid=${srv_uuid} → mise à jour"

  if [ "$_match_localhost" = "true" ]; then
    # Ne toucher NI à l'IP NI au user : c'est le serveur qui porte Coolify.
    payload="$(jq -n \
      --arg key "$PRIVATE_KEY_UUID" \
      '{private_key_uuid: $key, instant_validate: true}')"
  else
    payload="$(jq -n \
      --arg name "$SERVER_NAME" \
      --arg desc "$_description" \
      --arg ip "$SERVER_IP" \
      --arg user "$_user" \
      --argjson port "$_port" \
      --arg key "$PRIVATE_KEY_UUID" \
      '{name: $name, description: $desc, ip: $ip, user: $user, port: $port,
        private_key_uuid: $key, instant_validate: true}')"
  fi

  curl -fsS -X PATCH "${auth[@]}" -H "Content-Type: application/json" \
    "${COOLIFY_ENDPOINT}/servers/${srv_uuid}" -d "$payload" >/dev/null

  echo "✓ Serveur « ${SERVER_NAME} » mis à jour, validation déclenchée."
else
  echo "  aucun serveur nommé « ${SERVER_NAME} » → création"

  payload="$(jq -n \
    --arg name "$SERVER_NAME" \
    --arg desc "$_description" \
    --arg ip "$SERVER_IP" \
    --arg user "$_user" \
    --argjson port "$_port" \
    --arg key "$PRIVATE_KEY_UUID" \
    '{name: $name, description: $desc, ip: $ip, user: $user, port: $port,
      private_key_uuid: $key, is_build_server: false, instant_validate: true}')"

  response="$(curl -fsS -X POST "${auth[@]}" -H "Content-Type: application/json" \
    "${COOLIFY_ENDPOINT}/servers" -d "$payload")"

  new_uuid="$(printf '%s' "$response" | jq -r '.uuid // empty')"
  if [ -z "$new_uuid" ]; then
    echo "✗ Création refusée par l'API :" >&2
    printf '%s\n' "$response" >&2
    exit 1
  fi

  echo "✓ Serveur « ${SERVER_NAME} » créé (uuid=${new_uuid}), validation déclenchée."
fi

# La validation est asynchrone : un serveur peut répondre 200 à la création et
# rester injoignable. Le rappeler explicitement évite de croire l'infra prête.
echo "  Vérifier l'état : curl -sH \"Authorization: Bearer \$COOLIFY_TOKEN\" \\"
echo "    \"${COOLIFY_ENDPOINT}/servers\" | jq -r '.[] | \"\\(.name) \\(.ip)\"'"
