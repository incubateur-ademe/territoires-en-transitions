#!/usr/bin/env bash
# Authentifie Docker (root) sur un serveur applicatif pour tirer des images
# GHCR privées.
#
# Coolify tire via coolify-helper et ne monte les credentials QUE si
# $HOME/.docker/config.json existe pour le user SSH du serveur (root →
# /root/.docker/config.json). Un `docker pull` sur l'hôte peut réussir alors
# que le helper échoue en 403 si ce fichier est absent, ailleurs, ou s'il
# pointe vers un credsStore indisponible dans le helper.
#
# On écrit donc explicitement /root/.docker/config.json avec un auth inline
# (pas de credsStore), puis on vérifie le pull *dans* coolify-helper.
#
# Coolify n'expose aucune API de credentials registry : ce geste reste un SSH.
#
# Connexion directe à l'IP publique du serveur, dont le port 22 n'accepte que
# l'instance Coolify et la passerelle VPN : lancer ce script connecté au VPN.
#
# Invoqué par terraform_data.ghcr_docker_login (infra/coolify/main.tf), ou
# manuellement. Idempotent.
#
# Le PAT n'entre pas dans le state Terraform : lecture à l'apply via `scw`.
# Format du secret : <github-username>|<pat-with-read:packages>
#
# Variables attendues :
#   TARGET_HOST             adresse SSH du serveur cible (IP publique)
#   TARGET_HOST_KEY         clé d'hôte SSH attendue de la cible (ssh-ed25519 …),
#                           vérifiée en mode strict
#   SERVER_KEY_SECRET_NAME  secret SM de la clé privée SSH root du serveur
#   GHCR_PULL_SECRET_NAME   secret SM username|token GHCR
#   SECRET_PROJECT_ID       projet Scaleway du secret GHCR (explicite : le
#                           projet par défaut du profil scw peut être un autre)
#   SERVER_KEY_SECRET_PROJECT_ID  (optionnel) projet de la clé du serveur, si
#                           différent (prod), défaut SECRET_PROJECT_ID
#   GHCR_PULL_TEST_IMAGE    (optionnel) image:tag à tester dans le helper
set -euo pipefail

: "${TARGET_HOST:?TARGET_HOST non défini}"
: "${TARGET_HOST_KEY:?TARGET_HOST_KEY non défini : clé hôte SSH attendue}"
: "${SERVER_KEY_SECRET_NAME:?SERVER_KEY_SECRET_NAME non défini}"
: "${GHCR_PULL_SECRET_NAME:?GHCR_PULL_SECRET_NAME non défini}"
: "${SECRET_PROJECT_ID:?SECRET_PROJECT_ID non défini}"
_server_key_project="${SERVER_KEY_SECRET_PROJECT_ID:-${SECRET_PROJECT_ID}}"

_HELPER_IMAGE="${COOLIFY_HELPER_IMAGE:-docker.io/coollabsio/coolify-helper:1.0.16}"
# Si défini (ex. ghcr.io/incubateur-ademe/tet-app:prod-a5f7544ea), vérifie le
# pull *dans* le helper — le même chemin que Coolify. Sinon on s'arrête après
# l'écriture de config.json.
_TEST_IMAGE="${GHCR_PULL_TEST_IMAGE:-}"

for bin in scw jq ssh; do
  command -v "$bin" >/dev/null 2>&1 || {
    echo "✗ '$bin' requis mais introuvable." >&2
    exit 1
  }
done

_tmpdir="$(mktemp -d)"
trap 'rm -rf "$_tmpdir"' EXIT

echo "→ Lecture de la clé root du serveur (${SERVER_KEY_SECRET_NAME})…"
scw secret version access-by-path \
  secret-name="${SERVER_KEY_SECRET_NAME}" secret-path=/ revision=latest \
  project-id="${_server_key_project}" \
  --output=json | jq -r '.data // empty' | base64 --decode \
  >"${_tmpdir}/server_key"
chmod 600 "${_tmpdir}/server_key"
if ! grep -q "BEGIN OPENSSH PRIVATE KEY\|BEGIN.*PRIVATE KEY" "${_tmpdir}/server_key"; then
  echo "✗ Clé invalide ou secret vide (${SERVER_KEY_SECRET_NAME})." >&2
  exit 1
fi

echo "→ Lecture des credentials GHCR (${GHCR_PULL_SECRET_NAME})…"
_ghcr_raw="$(scw secret version access-by-path \
  secret-name="${GHCR_PULL_SECRET_NAME}" secret-path=/ revision=latest \
  project-id="${SECRET_PROJECT_ID}" \
  --output=json | jq -r '.data // empty' | base64 --decode)"
_ghcr_user="${_ghcr_raw%%|*}"
_ghcr_token="${_ghcr_raw#*|}"
if [ -z "${_ghcr_user}" ] || [ -z "${_ghcr_token}" ] || [ "${_ghcr_user}" = "${_ghcr_raw}" ]; then
  echo "✗ Secret GHCR mal formé. Attendu : <github-username>|<pat>" >&2
  echo "  scw secret version create \"\$(scw secret secret list name=${GHCR_PULL_SECRET_NAME} -o json | jq -r '.[0].id')\" data='user|token'" >&2
  exit 1
fi

# auth = base64(username:token), portable macOS/Linux (pas de -w0).
_auth="$(printf '%s:%s' "${_ghcr_user}" "${_ghcr_token}" | base64 | tr -d '\n')"

# Clés d'hôte épinglées, vérifiées en mode strict : ce script pousse une clé
# root et le PAT GHCR, il ne doit parler qu'aux machines attendues. Les clés
# viennent de Terraform (tls_private_key.sshd_host), installées au premier boot.
printf '%s %s\n' "${TARGET_HOST}" "${TARGET_HOST_KEY}" >"${_tmpdir}/known_hosts"

_ssh_opts=(
  -i "${_tmpdir}/server_key"
  -o IdentitiesOnly=yes
  -o StrictHostKeyChecking=yes
  -o HostKeyAlgorithms=ssh-ed25519
  -o UserKnownHostsFile="${_tmpdir}/known_hosts"
)

_ssh() {
  ssh "${_ssh_opts[@]}" "root@${TARGET_HOST}" "$@"
}

echo "→ Écriture de /root/.docker/config.json sur ${TARGET_HOST} (user=${_ghcr_user})…"
# Coolify teste ce chemin via `echo $HOME` puis monte le fichier dans
# coolify-helper.
_ssh bash -s <<EOF
set -euo pipefail
mkdir -p /root/.docker
cat > /root/.docker/config.json <<'CONFIG'
{
  "auths": {
    "ghcr.io": {
      "auth": "${_auth}"
    }
  }
}
CONFIG
chmod 600 /root/.docker/config.json
# Sanity : HOME non interactif doit être /root (sinon Coolify ne monte pas le fichier).
home="\$(echo \$HOME)"
if [ "\$home" != "/root" ]; then
  echo "⚠ HOME non-interactif=\$home (attendu /root). Coolify monte \\\$HOME/.docker/config.json." >&2
fi
test -f /root/.docker/config.json
grep -q '"ghcr.io"' /root/.docker/config.json
# Pas de credsStore : le helper n'a pas le binaire host.
if grep -Eq 'credsStore|credHelpers' /root/.docker/config.json; then
  echo "✗ config.json contient credsStore/credHelpers — incompatible avec coolify-helper." >&2
  exit 1
fi
echo "  config.json OK (HOME=\$home)"
EOF

echo "→ Vérification que Coolify montera bien le fichier…"
_ssh bash -s <<'EOF'
set -euo pipefail
# Reproduit le test Coolify : echo $HOME via SSH non-interactif + test -f
home="$(echo $HOME)"
cfg="${home}/.docker/config.json"
if [ ! -f "$cfg" ]; then
  echo "✗ $cfg absent (HOME=$home). Coolify démarrera le helper SANS credentials." >&2
  exit 1
fi
echo "  Coolify verra : $cfg"
EOF

if [ -n "${_TEST_IMAGE}" ]; then
  echo "→ Vérification du pull dans ${_HELPER_IMAGE} (comme Coolify) : ${_TEST_IMAGE}…"
  _ssh bash -s <<EOF
set -euo pipefail
docker run --rm \\
  -v /root/.docker/config.json:/root/.docker/config.json:ro \\
  -v /var/run/docker.sock:/var/run/docker.sock \\
  ${_HELPER_IMAGE} \\
  docker pull $(printf '%q' "${_TEST_IMAGE}")
EOF
  echo "✓ GHCR prêt sur ${TARGET_HOST} (config montable + pull helper OK)."
else
  echo "✓ /root/.docker/config.json écrit sur ${TARGET_HOST} (auth inline)."
  echo "  Pour valider comme Coolify :"
  echo "    GHCR_PULL_TEST_IMAGE=ghcr.io/incubateur-ademe/tet-app:<tag> $0"
fi
