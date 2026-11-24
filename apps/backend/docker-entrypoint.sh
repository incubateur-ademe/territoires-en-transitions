#!/bin/sh
# Démarrage du backend en conteneur : applique les migrations Sqitch si
# RUN_MIGRATIONS=true (posé par infra/coolify), puis lance l'API.
#
# Une migration en échec arrête le conteneur avant que l'API n'écoute : le
# déploiement Coolify échoue, la CD aussi, et cd-prod refuse de promouvoir.
# Règles d'écriture des migrations : doc/adr/0025-migrations-au-demarrage-du-backend.md.
set -eu

if [ "${RUN_MIGRATIONS:-}" = "true" ]; then
  : "${SUPABASE_DATABASE_URL:?SUPABASE_DATABASE_URL requis pour les migrations}"

  # Même vérification TLS que le pool Node (build-database-ssl.ts) : CA fournie,
  # certificat vérifié nom d'hôte compris (la RDB porte son IP privée en SAN).
  if [ -n "${SUPABASE_DATABASE_SSL_ROOT_CERT:-}" ]; then
    ca="$(mktemp)"
    # Comme parse-pem-certificate.ts : accepte des `\n` littéraux.
    printf '%b\n' "$SUPABASE_DATABASE_SSL_ROOT_CERT" >"$ca"
    export PGSSLMODE=verify-full PGSSLROOTCERT="$ca"
  fi

  # Sqitch n'est lancé que si le plan de l'image a quelque chose à déployer.
  # Sinon il n'aurait rien à faire, et sur une image plus ancienne (retour
  # arrière, base en avance sur le plan) il refuserait même de démarrer
  # (« Cannot find change … in sqitch.plan »), bloquant l'API alors que le
  # schéma reste compatible (ADR 0025).
  # Comparaison par change_id, comme Sqitch : un même nom défini autrement
  # (autre branche, rework) a un autre identifiant.
  # Requête en échec (base neuve sans registre, connexion) : Sqitch tranche.
  planned="$(sqitch plan --no-headers --format 'format:%H')"
  deployed="$(psql "$SUPABASE_DATABASE_URL" -Atc \
    "select change_id from sqitch.changes where project = 'tet'" 2>/dev/null)" || deployed=""
  if [ -n "$planned" ] && [ -n "$deployed" ] && printf '%s\n' "$planned" | DEPLOYED="$deployed" awk '
      BEGIN { n = split(ENVIRON["DEPLOYED"], ids, "\n"); for (i = 1; i <= n; i++) d[ids[i]] = 1 }
      !($1 in d) { pending = 1 }
      END { exit pending }'; then
    echo "Migrations : tous les changes du plan sont déjà déployés."
  else
    # lock_timeout : une migration qui n'obtient pas son verrou échoue au lieu
    # de bloquer les requêtes de l'API en place derrière elle.
    # Sqitch masque le mot de passe de la cible dans ses logs.
    PGOPTIONS="${PGOPTIONS:-} -c lock_timeout=5s" \
      sqitch deploy --mode change --verify \
      --target "db:pg:${SUPABASE_DATABASE_URL#*:}"
  fi
fi

exec node dist/main.js
