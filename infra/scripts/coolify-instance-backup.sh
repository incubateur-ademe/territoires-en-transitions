#!/usr/bin/env bash
# Sauvegarde de l'instance Coolify elle-même, exécutée *sur* le control plane
# par le timer systemd tet-coolify-backup.timer.
#
# Installé dans /usr/local/sbin/tet-coolify-backup par
# scripts/coolify-install-instance-backup.sh : ne pas lancer depuis un poste.
#
# Contenu de l'archive (procédure officielle Coolify, cf. docs
# core/backup-and-recovery/instance-backup) :
#   - coolify.dump : pg_dump --format=custom de la base coolify-db
#   - coolify.env  : /data/coolify/source/.env, qui porte l'APP_KEY sans
#                    laquelle les secrets de la base restaurée sont illisibles
#
# Base + APP_KEY = tous les secrets de tous les environnements : l'archive est
# chiffrée avec age vers les clés publiques des opérateurs avant de quitter la
# machine. Le serveur ne détient aucune clé privée age : un backup volé sur le
# bucket est inexploitable.
#
# Configuration : /etc/tet-coolify-backup/env (0600) et
# /etc/tet-coolify-backup/recipients.txt, écrits par le script d'installation.
set -euo pipefail

_conf_dir=/etc/tet-coolify-backup
# shellcheck source=/dev/null
. "${_conf_dir}/env"

: "${S3_ENDPOINT:?}" "${S3_BUCKET:?}" "${S3_REGION:?}" "${S3_PREFIX:?}"
: "${AWS_ACCESS_KEY_ID:?}" "${AWS_SECRET_ACCESS_KEY:?}"
export AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY

_coolify_env=/data/coolify/source/.env
_env_value() {
  sed -n "s/^$1=//p" "${_coolify_env}" | tail -n1
}
_db_user="$(_env_value DB_USERNAME)"
_db_name="$(_env_value DB_DATABASE)"
_db_user="${_db_user:-coolify}"
_db_name="${_db_name:-coolify}"

_ts="$(date -u +%Y%m%dT%H%M%SZ)"
_work="$(mktemp -d)"
trap 'rm -rf "${_work}"' EXIT
chmod 700 "${_work}"

echo "→ pg_dump ${_db_name} (coolify-db)…"
docker exec coolify-db \
  pg_dump --format=custom --no-acl --no-owner \
  --username="${_db_user}" "${_db_name}" \
  >"${_work}/coolify.dump"

# Un dump tronqué ou vide ne doit pas remplacer silencieusement un bon backup.
docker exec -i coolify-db pg_restore --list <"${_work}/coolify.dump" >/dev/null

cp "${_coolify_env}" "${_work}/coolify.env"

_archive="coolify-instance-${_ts}.tar.gz.age"
tar -C "${_work}" -czf - coolify.dump coolify.env |
  age --encrypt --recipients-file "${_conf_dir}/recipients.txt" \
    >"${_work}/${_archive}"

_key="${S3_PREFIX}/${_archive}"
_dest="s3://${S3_BUCKET}/${_key}"
echo "→ Envoi vers ${_dest}…"
# put-object plutôt que `s3 cp` : le bucket est sous Object Lock, et un upload
# vers un bucket verrouillé exige un Content-MD5 que `s3 cp` n'envoie pas
# toujours. L'archive tient largement sous la limite de 5 Go d'un PUT simple.
aws s3api put-object \
  --bucket "${S3_BUCKET}" --key "${_key}" \
  --body "${_work}/${_archive}" \
  --content-md5 "$(openssl md5 -binary "${_work}/${_archive}" | base64)" \
  --endpoint-url "${S3_ENDPOINT}" --region "${S3_REGION}" >/dev/null

echo "✓ Backup instance Coolify : ${_dest} ($(du -h "${_work}/${_archive}" | cut -f1))"
