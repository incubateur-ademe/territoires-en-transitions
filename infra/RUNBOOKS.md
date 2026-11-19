# Runbooks `infra/`

Procédures ponctuelles, sorties du [README](README.md) pour qu'il reste lisible.

- [Restauration complète de la base et bascule](#restauration-complète-de-la-base-et-bascule)
- [Migration vers l'instance Coolify de l'incubateur](#migration-vers-linstance-coolify-de-lincubateur)
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

## Migration vers l'instance Coolify de l'incubateur

On quitte notre control plane (`tet-platform-coolify`) pour notre Team sur l'instance de
l'incubateur, et son bastion pour le VPN. Les deux instances pilotent les mêmes serveurs le
temps de la bascule. Ce qui tourne déjà : la preprod TET, et **en production aldo et
rencontres**, plus Alloy sur nonprod et prod. Vérifier dans l'ancienne UI qu'aucune autre
ressource (une base Coolify, notamment) n'est hors Terraform : elle serait à migrer à part.

Prérequis côté incubateur : API activée sur l'instance, token `root` de notre Team créé,
**IP de sortie fixe** de l'instance connue.

1. **VPN.** Déposer `tet-platform-vpn-private-key` (cf.
   [README](README.md#mise-en-place-une-fois)), renseigner `vpn_peers` et
   `vpn_routed_public_ips` dans `platform/terraform.tfvars`, appliquer `platform`. Se
   connecter et vérifier : `ssh tet-ops@10.99.0.1`.
2. **Ouvrir le 22 des serveurs.** Dans `nonprod`, `preview` et `prod`,
   `ssh_allowed_ips` = IP de l'instance de l'incubateur + `vpn_public_ip`. **En prod,
   garder aussi l'ancienne `coolify_public_ip/32`** jusqu'à l'étape 6 : l'ancienne instance
   pilote encore le serveur. Appliquer les trois stacks.
3. **Token.** Déposer le token de notre Team comme nouvelle version de
   `tet-platform-coolify-api-token`.
4. **Coolify-as-code.** Dans `coolify/terraform.tfvars` : `coolify_endpoint`, `ssh_host` =
   IP publique de chaque serveur, retirer les variables du control plane
   (`coolify_public_ip`, `coolify_server_id`, `coolify_sshd_host_public_key`,
   `instance_backup_*`). Puis, connecté au VPN :

   ```sh
   source infra/scripts/tf-env.sh && source infra/scripts/coolify-env.sh
   terraform -chdir=infra/coolify init -reconfigure   # nouveau state coolify-incubateur/
   terraform -chdir=infra/coolify apply
   ```

   Les secrets applicatifs sont déjà dans Secret Manager : l'apply recrée tout, variables
   comprises. Refaire les flags de métriques Traefik de chaque serveur si l'instance
   reconfigure le proxy (cf. [README](README.md#métriques-traefik-une-fois-par-serveur)).
5. **Bascule, ressource par ressource** (`terraform -chdir=infra/coolify output
   application_ids`, plus les services `<env>/supabase-api` et `<env>/alloy`) :
   1. déployer depuis la nouvelle instance : `APP_ID=<env>/<app> infra/scripts/coolify-deploy.sh`
      (`IMAGE_TAG=<tag en place>` pour les images TET, lu dans l'ancienne UI) ;
   2. une fois le nouveau conteneur sain, **Stop** sur la ressource dans l'**ancienne**
      instance. Jamais de suppression de serveur : elle détruit les conteneurs.

   Le temps du recouvrement, Traefik voit deux routeurs sur le même `Host` et sert l'un
   ou l'autre : sans conséquence, c'est la même version. Commencer par la preprod, finir
   par aldo et rencontres en prod. Puis basculer la CD (`vars.COOLIFY_ENDPOINT` et
   `secrets.COOLIFY_TOKEN` des environnements GitHub), reconfigurer les webhooks GitHub
   des applications Git et contrôler les sondes Cockpit.
6. **Décommissionner** (change à part, une fois tout stable) :
   - arrêter la VM `tet-platform-coolify` (console) et retirer l'IP de l'ancienne instance
     de `ssh_allowed_ips` en prod ;
   - sur chaque serveur, supprimer les conteneurs et `/data/coolify/applications/<uuid>`
     orphelins de l'ancienne instance ;
   - dans `platform` : retirer `module "coolify"` (passer d'abord `prevent_destroy` et
     `protected` à false), `acl_ssh_rules`, `acl_ssh_return_rules`, les variables et
     outputs `coolify_*`, la règle de cycle de vie `coolify-instance-retention` ; supprimer
     `modules/coolify`. Appliquer, puis supprimer le volume racine conservé
     (`delete_on_termination = false`) une fois sûr de ne plus en avoir besoin ;
   - supprimer l'enregistrement DNS `coolify` chez Cloudflare ;
   - garder l'ancien state `coolify/terraform.tfstate` dans le bucket, pour mémoire.

## Lock Terraform fantôme

Un apply interrompu brutalement peut laisser son `.tflock` dans le bucket de state :

```sh
# Identifier le fichier de lock (adapter le préfixe au stack concerné)
aws s3 ls --endpoint-url https://s3.fr-par.scw.cloud s3://tet-tfstate/platform/
# Le supprimer après avoir vérifié qu'aucun apply n'est en cours
aws s3 rm --endpoint-url https://s3.fr-par.scw.cloud s3://tet-tfstate/platform/terraform.tfstate.tflock
```
