# 25. Migrations Sqitch au démarrage du backend

Date : 2026-11-23

## Statut

Accepté. Actif en preprod ; en prod à l'ouverture de `prod` dans
`application_environments` (`infra/coolify`).

## Contexte

La CD déploie chaque commit de main en preprod (`cd-preprod.yml`) et promeut
en prod les images de preprod (`cd-prod.yml`), mais aucun pipeline n'appliquait
les migrations Sqitch : elles partaient à la main, par le VPN. Code et schéma se
désynchronisaient.

Les bases RDB n'ont pas d'endpoint public et la prod n'a aucune route depuis le
VPC `tet` : un runner GitHub ne peut pas les joindre. Les Serverless Jobs
Scaleway ne se rattachent pas (encore) à un Private Network.

## Décision

L'image backend embarque Sqitch et `data_layer/sqitch`. Son entrypoint
(`apps/backend/docker-entrypoint.sh`) exécute `sqitch deploy --mode change
--verify` avant de lancer l'API quand `RUN_MIGRATIONS=true`, avec
`lock_timeout=5s`.

- Les migrations font partie de l'image attestée : la prod reçoit, par digest,
  celles jouées en preprod.
- Une migration en échec arrête le conteneur : le déploiement Coolify échoue,
  la CD aussi, et `cd-prod` refuse la promotion (dernier déploiement de
  preprod non `finished`).
- `cd-preprod` déploie le backend avant l'app et le site.

## Règles d'écriture des migrations

Pendant le déploiement, l'ancien backend sert encore les requêtes sur le
nouveau schéma, et un retour arrière se fait en redéployant l'image précédente
**sans** revenir sur le schéma. Donc :

1. **Compatible avec le backend N-1.** Renommer ou supprimer une colonne, une
   table, une fonction utilisée par le code se fait en deux livraisons (expand
   puis contract) : d'abord ajouter et basculer le code, puis supprimer une
   fois la version précédente retirée de la prod.
2. **Pas de `sqitch revert` en prod** : on corrige par une nouvelle migration.
   Une image plus ancienne redéployée trouve une base en avance sur son plan :
   l'entrypoint le détecte et saute les migrations au lieu de bloquer l'API.
3. **Court.** Une migration doit tenir en quelques secondes et ne pas attendre
   un verrou plus de 5 s. Backfill long, `CREATE INDEX CONCURRENTLY` (interdit
   en transaction) : hors pipeline, joués à la main par le VPN, puis ajoutés au
   plan sous une forme idempotente.

## Conséquences

- Image backend plus lourde (Perl, Sqitch, psql 15, environ 20 Mo de SQL et
  d'imports). Les builders excluent `data_layer` de leur `COPY . .` : une
  migration ne casse pas le cache de build des applications.
- Suppose un seul conteneur backend qui démarre à la fois. Sqitch pose un
  verrou consultatif pendant le deploy, mais plusieurs réplicas attendraient
  les uns derrière les autres.
- Le backend migre avec le rôle admin de la RDB, celui qu'il utilise déjà.
  Séparer un rôle applicatif sans DDL n'a de sens qu'avec un job de migration
  distinct (Serverless Job quand il joindra le Private Network).
