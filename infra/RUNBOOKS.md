# Runbooks `infra/`

Procédures ponctuelles, sorties du [README](README.md) pour qu'il reste lisible.

- [Restauration complète de la base et bascule](#restauration-complète-de-la-base-et-bascule)
- [Restauration de l'instance Coolify](#restauration-de-linstance-coolify)
- [Montée de version de Coolify](#montée-de-version-de-coolify)
- [Lock Terraform fantôme](#lock-terraform-fantôme)

## Restauration complète de la base et bascule

`data_layer/backup/restore.sh` ne convient pas pour passer de Supabase Cloud à la RDB
Scaleway : il restaure les données seules dans un schéma posé par Sqitch (ADR 0016), et le
rejeu de toutes les migrations bute sur des extensions absentes de Scaleway ; il ne reprend
qu'`auth.users` (tout le monde serait déconnecté) ; et il anonymise. On restaure donc le dump
**complet** (schéma + données, schéma `sqitch` compris : les déploiements suivants repartent
de là) avec [`scripts/restore-db.sh`](scripts/restore-db.sh) :

- les schémas internes de Supabase (`net`, `vault`, `graphql`, `realtime`…), les
  publications, event triggers et extensions indisponibles sont écartés, ainsi que `cron` :
  les jobs `pg_cron`, dépréciés, ne sont pas repris ;
- `auth` est restauré en `supabase_auth_admin` (GoTrue reste propriétaire de son schéma), le
  reste en `tet_admin`, dans l'ordre qu'imposent les FK vers `auth.users` ;
- `extensions` est ajouté au `search_path` des rôles, comme sur Supabase ;
- en preprod : `clean_data.sql`, plus la purge des sessions, refresh tokens et facteurs MFA.

La cible est lue dans les outputs de `infra/nonprod` (`restore-preprod-db`) ou de `infra/prod`
(`restore-prod-db`).

### Répétition sur preprod

Prérequis : IP du poste dans `pg_allowed_ips` (`nonprod/terraform.tfvars`), `psql` et
`pg_restore` 15+, `rclone`.

```sh
source infra/scripts/tf-env.sh && source infra/scripts/coolify-env.sh

# 1. Arrêter supabase-api et backend preprod dans Coolify : le script refuse de
#    tourner tant que GoTrue ou Storage sont connectés.

# 2. Télécharger le dernier backup de prod (données personnelles : hors du repo,
#    à supprimer après usage).
mkdir -p ~/tet-dumps && chmod 700 ~/tet-dumps
node_modules/.bin/dotenvx run -q --env-keys-file=.env.keys -f .env -- bash -c '
  AWS_ACCESS_KEY_ID="$BACKUP_AWS_ACCESS_KEY_ID" AWS_SECRET_ACCESS_KEY="$BACKUP_AWS_SECRET_ACCESS_KEY" \
  aws s3 cp "s3://$BACKUP_BUCKET/backup-AAAA-MM-JJ.dump" ~/tet-dumps/ \
    --endpoint-url "$BACKUP_ENDPOINT_URL" --region "$BACKUP_REGION"'

# 3. Relire le tri du sommaire : ce qui est écarté, et les triggers sur auth.
make -C infra/nonprod restore-preprod-db d=$HOME/tet-dumps/backup-AAAA-MM-JJ.dump list=true

# 4. Restaurer (≈ remplace toute la base preprod). Hash bcrypt entre quotes simples.
RESTORE_ENCRYPTED_PASSWORD='$2a$10$…' \
  make -C infra/nonprod restore-preprod-db d=$HOME/tet-dumps/backup-AAAA-MM-JJ.dump
```

Le script refuse de continuer si le dump vient d'un GoTrue ou d'un Storage plus récent que
l'image déployée (`auth.schema_migrations`, `storage.migrations`). Il s'arrête en échec s'il
a rencontré des erreurs : le journal, indiqué en fin de sortie, les liste
(`grep -n 'error:'`). Les données de `client_scores`, `pre_audit_scores` et
`post_audit_scores`, et celles des vues matérialisées que supprime
`evaluation/drop_client_scores_dependances`, ne sont pas reprises : leurs définitions si
(`_skip_data`). Une entrée du sommaire à écarter en plus : `EXCLUDE_REGEX='…'`. Rejouable :
chaque passage repart de zéro.

5. **Démarrer supabase-api** : GoTrue applique ses migrations au-delà de celles du dump,
   Storage les siennes. Puis `make -C infra/nonprod bootstrap-storage-sql` (propriété et
   droits des tables que Storage vient de créer).

6. **Fichiers** : Storage API range un objet sous `<tenant>/<bucket>/<name>/<version>`
   (tenant `tet-preprod`), l'endpoint S3 de Supabase l'expose sous `<bucket>/<name>`. Copie
   objet par objet à partir de `storage.objects`, avec deux remotes rclone : `supa` (endpoint
   S3 du projet Supabase prod, clés « S3 access keys » du dashboard) et `scw`
   (`tet-preprod-storage`, clés du secret `supabase-storage-s3-*`) :

   ```sh
   psql "…tet_admin@<pg_endpoint_ip>…" -AtF $'\t' -c \
     "select bucket_id, name, coalesce(version, '') from storage.objects" > objects.tsv
   while IFS=$'\t' read -r b n v; do
     printf 'supa:%s/%s\0scw:tet-preprod-storage/tet-preprod/%s/%s%s\0' \
       "$b" "$n" "$b" "$n" "${v:+/$v}"
   done < objects.tsv | xargs -0 -n2 -P16 rclone copyto
   ```

7. **Redéployer le backend**, puis vérifier : `/auth/v1/health`, `/storage/v1/status`, login
   avec le mot de passe de `RESTORE_ENCRYPTED_PASSWORD`, téléchargement d'une preuve,
   export d'un indicateur, chaîne JWT (étape 8 du plan
   `doc/plans/2026-09-25-001-…`). Noter la durée totale : c'est le RTO de la bascule.

**Point à vérifier — droits** : le dump est pris en `--no-acl`. Le backend, propriétaire de
tout, n'en souffre pas ; une politique RLS de `storage.objects` qui lit une table applicative
sans `security definer` échouerait pour `authenticated`. C'est ce que vérifie le
téléchargement d'une preuve à l'étape 7.

### Bascule de production

Même chemin, avec trois différences : un dump **frais** pris une fois l'application en
lecture seule (`data_layer/backup/backup.sh`, pas celui de la nuit), **aucune**
anonymisation (les sessions et refresh tokens restent valides grâce au même `JWT_SECRET`), et
une cible lue dans `infra/prod` :

```sh
make -C infra/prod restore-prod-db d=$HOME/tet-dumps/backup-AAAA-MM-JJ.dump list=true
make -C infra/prod restore-prod-db d=$HOME/tet-dumps/backup-AAAA-MM-JJ.dump
```

Garde-fou : le script refuse de tourner si la RDB prod a une connexion
(`auth.users.last_sign_in_at`) postérieure à la date du dump, c'est-à-dire si elle est déjà
en service. Les répétitions sur la RDB prod avant la bascule passent. Séquence complète (TTL
DNS, fenêtre de maintenance, garde de Supabase Cloud en lecture seule pendant 14 jours,
rollback) : section « Stratégie de bascule » de
`doc/plans/2026-05-15-001-migration-infra-supabase-koyeb-vers-scaleway-coolify.md`.

**Fichiers en deux passes.** La copie complète de l'étape 6 a pris 2 h 45 pour 273 Go
(répétition preprod du 2026-10-23) : trop long pour la fenêtre de maintenance.

1. **Quelques jours avant**, application en ligne : passe complète, en lisant
   `storage.objects` sur la base Supabase prod. Noter l'instant `T` du `select`.
2. **Pendant la fenêtre**, une fois le dump frais restauré : la même boucle, en ne listant
   que les objets touchés depuis `T`. `updated_at` couvre les créations comme les
   ré-uploads, qui donnent une nouvelle `version` donc une nouvelle clé :

   ```sql
   select bucket_id, name, coalesce(version, '') from storage.objects
   where updated_at > '<T>'
   ```

Les objets supprimés entre-temps restent dans le bucket Scaleway, orphelins et sans
conséquence. Ils faussent aussi le contrôle final : `rclone size` doit compter **au moins**
autant d'objets que `select count(*) from storage.objects`. Sinon, relancer la boucle de
la passe 2 (`copyto` saute les objets déjà identiques).

## Restauration de l'instance Coolify

Procédure Coolify officielle ([instance-restore](https://github.com/coollabsio/coolify-docs/blob/main/content/docs/core/backup-and-recovery/instance-restore.mdx)),
appliquée aux archives du timer `tet-coolify-backup` (cf.
[README](README.md#sauvegarde-de-linstance-coolify)) :

```sh
# 1. Récupérer et déchiffrer la dernière archive (poste opérateur).
#    Le bucket vit dans le projet tet-coolify-backups : utiliser sa clé dédiée, que l'API S3
#    résout dans le bon projet (les credentials perso visent le projet principal).
_c="$(scw secret version access-by-path secret-name=tet-platform-coolify-s3-credentials \
  secret-path=/ revision=latest -o json | jq -r .data | base64 --decode)"
export AWS_ACCESS_KEY_ID="${_c%%|*}" AWS_SECRET_ACCESS_KEY="${_c#*|}"; unset _c
aws s3 ls --endpoint-url https://s3.fr-par.scw.cloud s3://tet-coolify-backups/coolify-instance/
aws s3 cp --endpoint-url https://s3.fr-par.scw.cloud \
  s3://tet-coolify-backups/coolify-instance/<archive>.tar.gz.age .
age -d -i ~/tet-coolify-backup.key <archive>.tar.gz.age | tar -xzf -
# → coolify.dump + coolify.env

# 2. Sur un control plane à la *même version* de Coolify (coolify_version),
#    copier coolify.dump, puis restaurer :
docker exec -i coolify-db pg_restore --clean --if-exists --exit-on-error \
  --no-acl --no-owner --username=coolify --dbname=coolify < coolify.dump

# 3. Dans /data/coolify/source/.env, remplacer UNIQUEMENT la ligne APP_KEY= par celle
#    de coolify.env. Les autres valeurs (DB_PASSWORD…) appartiennent à la nouvelle
#    installation.

# 4. Relancer l'installeur à la même version : il redémarre Coolify et applique
#    les migrations éventuelles
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash -s <coolify_version>
```

Erreur « Invalid MAC » ou de chiffrement dans le dashboard : l'`APP_KEY` active n'est pas
celle de l'archive. Arrêter `coolify`, corriger `APP_KEY` dans le `.env`, relancer
l'installeur. Ne pas utiliser `APP_PREVIOUS_KEYS`.

Tester cette restauration sur une VM jetable après chaque montée de version de Coolify :
un backup jamais restauré n'est pas un backup.

## Montée de version de Coolify

L'auto-update est désactivé (`AUTOUPDATE=false`) : un update régénérerait les clés SSH de
Coolify dans notre dos. La version est figée par `coolify_version` (`platform/variables.tf`), et
cloud-init ne rejoue pas (`ignore_changes` sur `user_data`). Pour upgrader la VM :

```bash
ssh tet-ops@<coolify_public_ip>
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo AUTOUPDATE=false bash -s <version>
```

`AUTOUPDATE=false` se passe à `install.sh`, qui l'écrit dans le `.env`. Le modifier dans le
`.env` après coup ne suffit pas : vérifier ensuite dans l'UI (Settings, auto-update) qu'il
est bien désactivé.

Puis mettre à jour `coolify_version`, et tester une
[restauration](#restauration-de-linstance-coolify) sur une VM jetable. Vérifier aussi que
les flags de métriques Traefik sont toujours dans le `command` du proxy
(cf. [README](README.md#métriques-traefik-une-fois-par-serveur)).

## Lock Terraform fantôme

Un apply interrompu brutalement peut laisser son `.tflock` dans le bucket de state :

```sh
# Identifier le fichier de lock (adapter le préfixe au stack concerné)
aws s3 ls --endpoint-url https://s3.fr-par.scw.cloud s3://tet-tfstate/platform/
# Le supprimer après avoir vérifié qu'aucun apply n'est en cours
aws s3 rm --endpoint-url https://s3.fr-par.scw.cloud s3://tet-tfstate/platform/terraform.tfstate.tflock
```
