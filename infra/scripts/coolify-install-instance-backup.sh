#!/usr/bin/env bash
# Installe (ou met à jour) la sauvegarde de l'instance Coolify sur le control
# plane, puis lance un premier backup pour vérifier la chaîne de bout en bout.
#
# Posé par SSH plutôt que par cloud-init : cloud-init ne tourne qu'au premier
# boot (user_data est ignoré ensuite), et le serveur existe déjà. Idempotent.
#
# Invoqué par terraform_data.instance_backup (infra/coolify/main.tf), ou
# manuellement.
#
# Les credentials Object Storage n'entrent pas dans le state Terraform : lecture
# à l'apply via `scw`, puis écriture en 0600 sur le serveur (même posture que
# GHCR / R4). Ils transitent par l'entrée standard de ssh, jamais en argument.
#
# Variables attendues :
#   TARGET_HOST                 IP publique du control plane
#   HOST_KEY_SECRET_NAME        secret SM de la clé privée SSH root du control plane
#   S3_ENDPOINT                 ex. https://s3.fr-par.scw.cloud
#   S3_BUCKET                   bucket cible
#   S3_REGION                   ex. fr-par
#   S3_PREFIX                   préfixe des objets, ex. coolify-instance
#   S3_CREDENTIALS_SECRET_NAME  secret SM access_key|secret_key
#   AGE_RECIPIENTS              clés publiques age, une par ligne
#   BACKUP_ON_CALENDAR          expression OnCalendar systemd
set -euo pipefail

: "${TARGET_HOST:?TARGET_HOST non défini}"
: "${HOST_KEY_SECRET_NAME:?HOST_KEY_SECRET_NAME non défini}"
: "${S3_ENDPOINT:?S3_ENDPOINT non défini}"
: "${S3_BUCKET:?S3_BUCKET non défini}"
: "${S3_REGION:?S3_REGION non défini}"
: "${S3_PREFIX:?S3_PREFIX non défini}"
: "${S3_CREDENTIALS_SECRET_NAME:?S3_CREDENTIALS_SECRET_NAME non défini}"
: "${AGE_RECIPIENTS:?AGE_RECIPIENTS non défini}"
: "${BACKUP_ON_CALENDAR:?BACKUP_ON_CALENDAR non défini}"

for bin in scw jq ssh; do
  command -v "$bin" >/dev/null 2>&1 || {
    echo "✗ '$bin' requis mais introuvable." >&2
    exit 1
  }
done

_script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
_tmpdir="$(mktemp -d)"
trap 'rm -rf "$_tmpdir"' EXIT

echo "→ Lecture de la clé host du control plane (${HOST_KEY_SECRET_NAME})…"
scw secret version access-by-path \
  secret-name="${HOST_KEY_SECRET_NAME}" secret-path=/ revision=latest \
  --output=json | jq -r '.data // empty' | base64 --decode \
  >"${_tmpdir}/host_key"
chmod 600 "${_tmpdir}/host_key"
if ! grep -q "BEGIN OPENSSH PRIVATE KEY\|BEGIN.*PRIVATE KEY" "${_tmpdir}/host_key"; then
  echo "✗ Clé invalide ou secret vide (${HOST_KEY_SECRET_NAME})." >&2
  exit 1
fi

echo "→ Lecture des credentials Object Storage (${S3_CREDENTIALS_SECRET_NAME})…"
_creds_raw="$(scw secret version access-by-path \
  secret-name="${S3_CREDENTIALS_SECRET_NAME}" secret-path=/ revision=latest \
  --output=json | jq -r '.data // empty' | base64 --decode)"
_s3_key="${_creds_raw%%|*}"
_s3_secret="${_creds_raw#*|}"
if [ -z "${_s3_key}" ] || [ -z "${_s3_secret}" ] || [ "${_s3_key}" = "${_creds_raw}" ]; then
  echo "✗ Secret S3 mal formé. Attendu : <access_key>|<secret_key>" >&2
  exit 1
fi

_ssh() {
  ssh -i "${_tmpdir}/host_key" \
    -o IdentitiesOnly=yes \
    -o StrictHostKeyChecking=accept-new \
    -o UserKnownHostsFile="${_tmpdir}/known_hosts" \
    "root@${TARGET_HOST}" "$@"
}

# Écrit l'entrée standard dans un fichier distant, créé directement avec des
# droits restreints (umask) pour que les credentials ne soient jamais lisibles.
_put() {
  _ssh "umask 077 && cat > '$2' && chmod $1 '$2'"
}

echo "→ Installation des dépendances (age, awscli, openssl) sur ${TARGET_HOST}…"
_ssh 'apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq age awscli openssl >/dev/null'

echo "→ Écriture du script et de la configuration…"
_put 0755 /usr/local/sbin/tet-coolify-backup <"${_script_dir}/coolify-instance-backup.sh"
_ssh 'install -d -m 0700 /etc/tet-coolify-backup'
printf '%s\n' "${AGE_RECIPIENTS}" |
  _put 0644 /etc/tet-coolify-backup/recipients.txt
# %q : les valeurs sont relues par `.` côté serveur.
printf 'S3_ENDPOINT=%q\nS3_BUCKET=%q\nS3_REGION=%q\nS3_PREFIX=%q\nAWS_ACCESS_KEY_ID=%q\nAWS_SECRET_ACCESS_KEY=%q\n' \
  "${S3_ENDPOINT}" "${S3_BUCKET}" "${S3_REGION}" "${S3_PREFIX}" "${_s3_key}" "${_s3_secret}" |
  _put 0600 /etc/tet-coolify-backup/env

echo "→ Installation du timer systemd (${BACKUP_ON_CALENDAR})…"
_ssh bash -s <<EOF
set -euo pipefail
cat > /etc/systemd/system/tet-coolify-backup.service <<'UNIT'
[Unit]
Description=Sauvegarde de l'instance Coolify vers Object Storage (TET)
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/tet-coolify-backup
UNIT

cat > /etc/systemd/system/tet-coolify-backup.timer <<'UNIT'
[Unit]
Description=Sauvegarde planifiée de l'instance Coolify (TET)

[Timer]
OnCalendar=${BACKUP_ON_CALENDAR}
RandomizedDelaySec=15min
# Rattrape un backup manqué si la machine était éteinte à l'heure prévue.
Persistent=true

[Install]
WantedBy=timers.target
UNIT

systemctl daemon-reload
systemctl enable --now tet-coolify-backup.timer
EOF

echo "→ Premier backup (vérification de bout en bout)…"
if ! _ssh 'systemctl start tet-coolify-backup.service'; then
  _ssh 'journalctl -u tet-coolify-backup.service -n 30 --no-pager' >&2 || true
  echo "✗ Le premier backup a échoué (journal ci-dessus)." >&2
  exit 1
fi
_ssh 'journalctl -u tet-coolify-backup.service -n 1 --no-pager -o cat'
_ssh 'systemctl list-timers tet-coolify-backup.timer --no-pager | head -n2'

echo "✓ Sauvegarde de l'instance Coolify installée sur ${TARGET_HOST}."
