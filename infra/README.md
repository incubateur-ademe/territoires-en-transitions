# `infra/` — Infrastructure as Code Scaleway

Terraform qui décrit l'infrastructure cible TET sur Scaleway, dans le cadre de la migration depuis Supabase Cloud + Koyeb. Voir le brainstorm de référence :
[`doc/plans/2026-05-15-001-migration-infra-supabase-koyeb-vers-scaleway-coolify.md`](../doc/plans/2026-05-15-001-migration-infra-supabase-koyeb-vers-scaleway-coolify.md).

## Topologie

Une instance Coolify **unique et transverse**, sur son propre serveur, pilote quatre
environnements répartis sur trois serveurs applicatifs.

| Serveur                | Tier     | Projet Scaleway | Rôle                                                     |
| ---------------------- | -------- | --------------- | -------------------------------------------------------- |
| `tet-platform-coolify` | platform | principal       | Control plane Coolify + bastion SSH. Aucune application. |
| `tet-prod-apps`        | prod     | **`tet-prod`**  | Applications de production.                              |
| `tet-nonprod-apps`     | nonprod  | principal       | Mutualisé : preprod **et** staging.                      |
| `tet-preview-apps`     | preview  | principal       | Previews éphémères, une par pull request.                |

La prod a son propre projet Scaleway (créé par un admin, cf. [Prérequis admin](#prérequis-admin-organisation-scaleway)) et son propre VPC (créé par
`prod`), sans aucun lien réseau avec le VPC partagé. Les backups ont aussi leur projet,
`tet-backups` (cf. [Sauvegarde de l'instance Coolify](#sauvegarde-de-linstance-coolify)).

| Environnement | Postgres                    | Redis                       |
| ------------- | --------------------------- | --------------------------- |
| prod          | RDB managé Scaleway         | Redis managé Scaleway       |
| preprod       | RDB managé Scaleway         | Redis managé Scaleway       |
| staging       | conteneur Coolify           | conteneur Coolify           |
| preview       | conteneur Coolify, éphémère | conteneur Coolify, éphémère |

Preprod reste sur du managé pour rester **iso-prod**. L'admin RDB Scaleway n'est pas
superuser : c'est cette contrainte qui impose `scaleway_rdb_user.supabase_auth_admin`,
le rôle `postgres` NOLOGIN factice et la mise en commentaire de `pgcrypto` dans
[`nonprod/supabase-api/sql/001-bootstrap-auth-roles.sql`](nonprod/supabase-api/sql/001-bootstrap-auth-roles.sql).
Un Postgres conteneurisé donne le superuser et masquerait cette classe de bug jusqu'à
la production.

## Réseau

Deux VPC sans lien entre eux :

- `tet` (projet principal) : `enable_routing = true`, un Private Network par tier hors
  prod, et deux ACL en `default_policy = "drop"`, une IPv4 et une IPv6 ;
- `tet-prod` (projet `tet-prod`) : un seul Private Network, `10.0.3.0/24`, avec le
  serveur, le Postgres et le Redis de production.

| Private Network                  | CIDR          | Membres                                | IP fixe du serveur |
| -------------------------------- | ------------- | -------------------------------------- | ------------------ |
| `tet-platform-pn`                | `10.0.0.0/24` | VM Coolify                             | `10.0.0.10`        |
| `tet-nonprod-pn`                 | `10.0.1.0/24` | VM nonprod, RDB preprod, Redis preprod | `10.0.1.10`        |
| `tet-prod-pn` _(VPC `tet-prod`)_ | `10.0.3.0/24` | VM prod, RDB prod, Redis prod          | `10.0.3.10`        |
| `tet-preview-pn`                 | `10.0.4.0/24` | VM preview                             | `10.0.4.10`        |

`10.0.2.0/24` est laissé libre : staging n'a pas de Private Network propre, ses
conteneurs vivent sur le serveur nonprod.

Dans le VPC `tet`, le seul flux inter-Private Networks autorisé est **TCP/22 depuis le
control plane vers les serveurs nonprod et preview**.

La prod n'a **aucune route** depuis ce VPC. Coolify la pilote en SSH sur son **IP
publique**, que son security group n'ouvre qu'à l'IP publique du control plane
(`coolify_public_ip` dans `prod/terraform.tfvars`). Isoler par l'absence de chemin plutôt
que par des règles de filtrage : une erreur d'ACL côté nonprod ou preview ne peut pas
ouvrir la prod. Contrepartie : si l'IP publique de Coolify change, réappliquer `prod`, sinon
Coolify perd l'accès.

Conséquences :

- Coolify pilote nonprod et preview **sur IP privée**, la prod sur IP publique filtrée ;
- le port 22 est **fermé publiquement** sur nonprod et preview, et limité à l'IP de
  Coolify sur la prod ;
- prod, nonprod et preview ne peuvent pas se joindre entre eux ;
- le trafic intra-PN reste en L2 et n'est pas filtré : aucune règle nécessaire pour les
  accès app → Postgres/Redis, qui vivent dans le même PN que leur serveur ;
- les humains passent par le bastion : `ssh -J tet-ops@<ip-coolify> …`.

> Les Security Groups Scaleway ne filtrent que l'**interface publique**. Les ACL du VPC sont
> le seul point de contrôle du trafic privé.
>
> Chaque Private Network reçoit d'office un /64 IPv6, qu'on ne peut ni choisir ni
> désactiver, et Scaleway tient une ACL distincte par version d'IP. L'ACL IPv6 refuse donc
> tout : aucun flux légitime ne passe en IPv6 entre PN. Sans elle, l'IPv6 serait routé
> librement et prod redeviendrait joignable depuis nonprod et preview.

Le plan d'adressage du VPC `tet` est déclaré dans `platform/variables.tf` (`network_plan`),
celui de la prod dans `prod/variables.tf`. Nonprod et preview redéclarent l'IP de _leur_
serveur dans `server_private_ipv4_address` :
**les deux doivent rester alignés**, sinon l'ACL bloque le SSH de Coolify.

## Structure

```
infra/
├── modules/
│   ├── network/       VPC partagé + Private Networks + ACL
│   ├── coolify/       VM du control plane Coolify (+ bastion)
│   ├── app-server/    VM Docker générique pilotée par Coolify
│   ├── postgres/      Instance RDB managée
│   └── redis/         Cluster Redis managé
├── scripts/           Helpers à sourcer (tf-env.sh, coolify-env.sh)
│                      + scripts d'API (upsert-server, ghcr-docker-login,
│                        configure-s3-storage)
├── platform/          Socle transverse : VPC, ACL, DNS, VM Coolify, buckets
├── prod/              Serveur prod + RDB prod + Redis prod
├── nonprod/           Serveur mutualisé + RDB preprod + Redis preprod
│   ├── supabase-api/  Stack Docker Compose GoTrue + Storage (collée dans Coolify)
│   └── Makefile       Bootstrap SQL des rôles GoTrue
├── preview/           Serveur preview + wildcard DNS
└── coolify/           Coolify-as-code : clés, serveurs, projets, S3 storage
```

Un **state par stack**, tous dans le bucket `tet-tfstate` :
`platform/`, `prod/`, `nonprod/`, `preview/`, `coolify/`.

`coolify/` a un state distinct parce qu'il suppose Coolify **déjà up et joignable** : le
garder séparé évite que le `plan` de l'infra Scaleway exige que l'application tourne.

### Ordre d'application

```
platform  →  nonprod / prod / preview  →  coolify
```

`platform` produit le VPC partagé, ses Private Networks, le control plane et le bucket de
backups, et relaie l'ID du projet `tet-prod` créé par l'admin. `prod` crée son propre VPC
dans ce projet et ne reprend de `platform` que cet ID et l'IP publique de Coolify. Les stacks
applicatifs consomment ces valeurs **par report manuel** dans leur `terraform.tfvars`
(pas de `terraform_remote_state` : les stacks restent découplés). `coolify` vient en
dernier, quand les serveurs existent et que Coolify répond.

## Pré-requis

- **Terraform >= 1.10.0** (requis pour `use_lockfile`)
- **Compte Scaleway** avec un projet dédié
- **Clés d'accès Scaleway** (Access Key + Secret Key) pour l'IAM qui pilote Terraform
- **Bucket Scaleway Object Storage** dédié au state (cf. Bootstrap ci-dessous)
- `scw`, `aws`, `jq`, `curl`, `ssh` — et `psql` pour le bootstrap SQL
- les **prérequis admin** ci-dessous, faits par un admin de l'organisation Scaleway

### Prérequis admin (organisation Scaleway)

Créer un projet ou une application IAM exige des droits d'organisation, que les
credentials Terraform n'ont pas. Un admin crée donc, une fois :

1. **Trois projets** : `tet` (projet principal), `tet-prod` (la production, isolée du projet principal)
   et `tet-backups` (le bucket de backups). Leurs IDs vont dans `main_project_id`,
   `prod_project_id` et `backups_project_id` de `platform/terraform.tfvars`.
2. **Les droits des opérateurs Terraform** sur ces projets, en plus du projet principal :
   - `tet-prod` : de quoi créer serveur, VPC, IPAM, RDB, Redis, secrets et DNS. Le plus
     simple : `AllProductsFullAccess` limité à ce projet ;
   - `tet-backups` : `ObjectStorageFullAccess` limité à ce projet (bucket, verrou, cycle
     de vie). Le verrou COMPLIANCE empêche quand même toute suppression de version avant
     l'échéance.
3. **L'application IAM `tet-coolify-backups`**, pour Coolify et le backup de son instance :

   - une politique limitée au projet `tet-backups`, avec les permission sets
     `ObjectStorageBucketsRead`, `ObjectStorageObjectsRead`, `ObjectStorageObjectsWrite`
     et `ObjectStorageObjectsDelete`. Surtout pas `BucketsWrite` : la clé ne doit pouvoir
     modifier ni le cycle de vie, ni le verrou, ni la politique du bucket ;
   - une clé d'API dont le **projet par défaut est `tet-backups`** : l'API S3 de Scaleway
     résout les buckets dans le projet par défaut de la clé.

   L'admin transmet la clé par un canal sûr, et un opérateur la dépose dans Secret Manager
   (cf. [Bootstrap des credentials Object Storage](#bootstrap-des-credentials-object-storage-s3-coolify)).

## Bootstrap initial (une fois)

Le bucket de state doit exister **avant** le premier `terraform init`.

```sh
# 1. Créer un projet Scaleway via la console ou le CLI
scw init

# 2. Créer le bucket de state avec versioning ET Object Lock activés.
#    Object Lock est obligatoire : il active les conditional writes S3
#    (If-None-Match: *) dont dépend use_lockfile pour le state locking Terraform.
scw object bucket create name=tet-tfstate region=fr-par enable-versioning=true

aws s3api put-object-lock-configuration \
  --endpoint-url https://s3.fr-par.scw.cloud \
  --bucket tet-tfstate \
  --object-lock-configuration '{
    "ObjectLockEnabled": "Enabled",
    "Rule": {
      "DefaultRetention": {
        "Mode": "GOVERNANCE",
        "Days": 30
      }
    }
  }'
```

## Workflow en local

Pré-requis une fois pour toutes :

```sh
brew install scw   # macOS ; sur Linux voir https://github.com/scaleway/scaleway-cli
scw init           # crée ~/.config/scw/config.yaml (access key, secret, project, org)
```

Installer la CLI AWS :
[https://www.scaleway.com/en/docs/object-storage/api-cli/object-storage-aws-cli/#how-to-install-the-aws-cli](https://www.scaleway.com/en/docs/object-storage/api-cli/object-storage-aws-cli/#how-to-install-the-aws-cli)

Ensuite, à chaque session de travail :

```sh
# Sourcer le wrapper qui exporte les credentials sous les noms attendus
# par le backend S3 (AWS_*) et par le provider Scaleway (SCW_*).
# IMPORTANT : `source` (ou `.`), pas d'exécution directe, sinon les exports
# se perdent dans le sous-shell.
source infra/scripts/tf-env.sh

cd infra/platform

cp terraform.tfvars.example terraform.tfvars
$EDITOR terraform.tfvars

terraform init
terraform fmt -check -recursive
terraform validate
terraform plan -out=tfplan
terraform apply tfplan
```

Le wrapper [`scripts/tf-env.sh`](scripts/tf-env.sh) lit `scw config` et exporte :

- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — utilisés par le backend S3 pour lire/écrire le state distant (le backend S3 réutilise les conventions de nommage AWS, c'est normal)
- `SCW_ACCESS_KEY` / `SCW_SECRET_KEY` — utilisés par le provider `scaleway/scaleway` pour piloter les ressources
- `SCW_DEFAULT_PROJECT_ID` / `SCW_DEFAULT_ORGANIZATION_ID` — defaults pour les appels API

Puis, pour un stack applicatif, reporter les valeurs produites par `platform` :

```sh
terraform -chdir=platform output -json private_network_ids | jq -r .nonprod
terraform -chdir=platform output -raw coolify_public_ip
```

Après le premier apply d'un stack applicatif, **récupérer immédiatement** les mots de
passe générés et les stocker dans Secret Manager :

```sh
cd infra/nonprod
terraform output -raw pg_admin_password
terraform output -raw redis_admin_password
terraform output -raw supabase_auth_admin_password
```

## Accès aux serveurs (bastion)

Le seul chemin vers les serveurs applicatifs est le control plane : nonprod et preview
n'exposent pas le port 22, et celui de la prod n'accepte que l'IP de Coolify.

```sh
# Se connecter au bastion
ssh tet-ops@$(terraform -chdir=infra/platform output -raw coolify_public_ip)

# Rebondir vers un serveur applicatif, en root, avec sa clé de Secret Manager
scw secret version access-by-path \
  secret-name="$(terraform -chdir=infra/nonprod output -raw server_ssh_key_secret_name)" \
  secret-path=/ revision=latest -o json | jq -r '.data' | base64 -d > /tmp/srv_key
chmod 600 /tmp/srv_key

ssh -J tet-ops@<ip-coolify> -i /tmp/srv_key \
  root@$(terraform -chdir=infra/nonprod output -raw server_private_ip)
```

Pour la prod, même rebond, mais vers son **IP publique**, avec la clé lue dans le projet
`tet-prod` :

```sh
scw secret version access-by-path project-id="$(terraform -chdir=infra/platform output -raw prod_project_id)" \
  secret-name="$(terraform -chdir=infra/prod output -raw server_ssh_key_secret_name)" \
  secret-path=/ revision=latest -o json | jq -r '.data' | base64 -d > /tmp/prod_key
chmod 600 /tmp/prod_key

ssh -J tet-ops@<ip-coolify> -i /tmp/prod_key \
  root@$(terraform -chdir=infra/prod output -raw server_ssh_host)
```

Vérifier au passage que l'isolation tient : depuis le serveur nonprod, aucune connexion
vers la prod ne doit aboutir, ni en privé (pas de route), ni en public (IP source ≠
Coolify).

```sh
nc -zv -w3 10.0.3.10 22        # attendu : timeout
nc -zv -w3 <ip-publique-prod> 22   # attendu : timeout
```

## Clé SSH « host » de Coolify (serveur localhost)

Coolify tourne dans un conteneur Docker et pilote **son propre serveur** en SSH, en tant
que `root@host.docker.internal`. Par défaut il génère lui-même une paire de clés à
l'installation (`/data/coolify/ssh/keys/`). Problème : cette clé est **régénérée à chaque
update ou réinstall de Coolify** (ou si `APP_KEY` change), ce qui casse la connexion avec
l'erreur _« Server is not reachable — Permission denied (publickey) »_.

Pour fermer cette boucle, Terraform génère une paire ED25519 **maîtrisée par nous**
(`tls_private_key.host` dans le module `coolify`) :

- la **clé publique** est injectée dans `/root/.ssh/authorized_keys` via cloud-init ;
- la **clé privée** est stockée dans Secret Manager (`tet-platform-coolify-host-ssh-key`).

Le stack `coolify/` l'enregistre ensuite dans Coolify et l'assigne au serveur localhost,
sans intervention dans l'UI. Le même mécanisme vaut pour chaque serveur applicatif, avec
**une clé par serveur** (`tet-<tier>-server-ssh-key`) : révoquer l'accès à un serveur
compromis ne casse pas les autres.

> **Auto-update Coolify** : désactivé par cloud-init (`AUTOUPDATE=false` dans
> `/data/coolify/source/.env`) pour éviter qu'un update régénère les clés dans notre dos.
> Les montées de version se font manuellement, quand on le décide.
>
> **Version figée** : `coolify_version` (défaut `4.3.19`, dernière stable CDN
> `coolify.v4.version`). cloud-init ne rejoue pas (`lifecycle.ignore_changes` sur
> `user_data`) — pour upgrader une VM déjà provisionnée :
>
> ```bash
> ssh tet-ops@<coolify_public_ip>
> sudo curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash -s 4.3.19
> # Réaffirmer AUTOUPDATE=false si l'install l'a réécrit
> sudo sed -i 's/^AUTOUPDATE=.*/AUTOUPDATE=false/' /data/coolify/source/.env \
>   || echo 'AUTOUPDATE=false' | sudo tee -a /data/coolify/source/.env
> ```

## Dashboard Coolify

Le port 8000 (dashboard en clair) n'est **jamais** ouvert. Le dashboard est servi en
HTTPS sur 443 par le Traefik de Coolify, une fois son FQDN configuré.

1. Poser chez le registrar un enregistrement A `coolify.territoiresentransitions.fr`
   vers `terraform -chdir=infra/platform output -raw coolify_public_ip`.
2. Premier accès, avant que le FQDN soit actif, par tunnel SSH :
   `ssh -L 8000:localhost:8000 tet-ops@<ip-coolify>` puis http://localhost:8000
3. Créer le compte admin, puis **Settings → Instance Domain** → le FQDN. Coolify
   déclenche l'émission du certificat Let's Encrypt (challenge HTTP-01 sur le port 80,
   ouvert au monde par le security group).

`APP_URL` est déjà aligné sur le FQDN par cloud-init, mais le routage Traefik dépend du
réglage « Instance Domain », stocké en base : l'étape 3 reste manuelle.

## DNS

L'apex `territoiresentransitions.fr` et les noms de production restent chez le registrar
actuel. Seules les zones non-prod sont déléguées à Scaleway.

Prérequis manuel, une fois :

```sh
# Enregistre le domaine racine comme domaine externe (validation par TXT
# d'ownership — les NS de l'apex ne bougent pas).
scw domain external-domain register domain=territoiresentransitions.fr
```

Puis passer `dns_enabled = true` dans `platform/terraform.tfvars` et appliquer. Récupérer
les serveurs de noms de chaque zone créée et les poser chez le registrar sous forme
d'enregistrements NS :

```sh
terraform -chdir=infra/platform output -json dns_zone_nameservers
```

Les enregistrements eux-mêmes appartiennent aux stacks applicatifs : un `*` et un apex par
zone, pointant sur l'IP publique du serveur du tier. Coolify émet ensuite un certificat
par sous-domaine en HTTP-01 — ni DNS-01 ni certificat wildcard nécessaires.

## Couche Coolify-as-code (`infra/coolify/`)

Configuration de l'instance Coolify (clés, serveurs, projets, S3 storage) via le provider
communautaire [`sierrajc/coolify`](https://registry.terraform.io/providers/sierrajc/coolify)
et, quand il ne couvre pas le besoin, des appels API directs.

> ⚠️ Provider en beta (Coolify v4). La ressource `coolify_server` est marquée « not fully
> implemented » : on ne l'utilise **pas**. L'enregistrement des serveurs passe par
> [`scripts/coolify-upsert-server.sh`](scripts/coolify-upsert-server.sh) (endpoints
> vérifiés), idempotent par nom de serveur. `coolify_private_key` et `coolify_project`
> sont en revanche utilisés nativement.

### Bootstrap du token API (une fois)

Les tokens API Coolify se créent **uniquement dans l'UI** :

1. Coolify → **Security → API Tokens** → créer un token **scope `root`**
   (nécessaire pour gérer serveurs + clés + projets + env vars).
2. Le stocker dans Secret Manager :
   ```sh
   scw secret create name=tet-platform-coolify-api-token
   scw secret version create secret-name=tet-platform-coolify-api-token \
     secret-path=/ data='<id>|<token>'
   ```

### Bootstrap des credentials GHCR (une fois)

Coolify tire les images privées `ghcr.io/incubateur-ademe/*` via Docker sur chaque
serveur applicatif (`root`). Il n'existe pas d'API Coolify pour ça : on automatise
l'écriture de `/root/.docker/config.json` (auth inline) depuis Terraform
([`scripts/coolify-ghcr-docker-login.sh`](scripts/coolify-ghcr-docker-login.sh)). Coolify
monte ce fichier dans `coolify-helper` uniquement s'il existe pour `$HOME` du user SSH —
un `docker pull` réussi sur l'hôte ne suffit pas.

Le script passe par le bastion : les serveurs applicatifs n'ont pas de SSH public.

1. Créer un PAT GitHub (classic `read:packages`, ou fine-grained avec lecture des packages
   de l'org) — idéalement un **machine user** dédié.
2. Le stocker dans Secret Manager au format `username|token`. Un seul secret pour tous les
   serveurs :
   ```sh
   scw secret create name=tet-platform-ghcr-pull
   scw secret version create secret-name=tet-platform-ghcr-pull \
     secret-path=/ data='<github-username>|<pat>'
   ```

Après rotation du PAT : créer une nouvelle version du secret, puis incrémenter
`ghcr_pull_credentials_revision` dans `coolify/terraform.tfvars`.

### Bootstrap des credentials Object Storage (S3 Coolify)

Coolify enregistre un **S3 storage** (cible des backups DB / volumes) via l'API
`POST/PATCH /s3-storages` + `POST …/validate`. Le provider n'a pas de ressource native :
on automatise avec [`scripts/coolify-configure-s3-storage.sh`](scripts/coolify-configure-s3-storage.sh).

`platform` crée le **bucket** (`tet-coolify-backups`) dans le projet `tet-backups`,
transverse à tous les environnements, avec versioning et **Object Lock en mode
COMPLIANCE** (14 jours) : aucune version ne peut être supprimée avant l'échéance, par
personne. Coolify garde sa propre rétention (ses suppressions posent un delete marker), et
une règle de cycle de vie purge les versions supprimées une fois le verrou expiré.

Il crée aussi le secret `tet-platform-coolify-s3-credentials`, vide. La clé qu'il doit
porter, celle de l'application IAM `tet-coolify-backups`, est créée par l'admin de
l'organisation (cf. [Prérequis admin](#prérequis-admin-organisation-scaleway)). On la
dépose à la main, au format `access_key|secret_key` lu par les scripts de `infra/coolify` :
elle n'entre donc pas dans le state.

```sh
scw secret version create secret-name=tet-platform-coolify-s3-credentials \
  project-id=<projet-principal> secret-path=/ data='SCWXXXX|<secret_key>'
```

Rotation : l'admin crée une nouvelle clé pour l'application, on dépose une nouvelle
version du secret, puis on incrémente `s3_credentials_revision` dans
`coolify/terraform.tfvars` et on applique `coolify`. L'admin supprime ensuite l'ancienne
clé.

### Workflow

```sh
source infra/scripts/tf-env.sh        # creds Scaleway (backend S3 + provider + secrets)
source infra/scripts/coolify-env.sh   # COOLIFY_ENDPOINT + COOLIFY_TOKEN (+ TF_VAR_coolify_token)

cd infra/coolify
cp terraform.tfvars.example terraform.tfvars && $EDITOR terraform.tfvars
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

L'`apply` : (1) enregistre les clés SSH dans Coolify, (2) assigne la clé host au serveur
localhost, (3) crée ou met à jour les trois serveurs applicatifs et déclenche leur
validation, (4) authentifie Docker sur `ghcr.io` en `root` sur chacun, (5) crée les
projets, (6) crée/met à jour le S3 storage Scaleway et le valide.

Vérifier que Coolify voit bien tous ses serveurs :

```sh
curl -sH "Authorization: Bearer $COOLIFY_TOKEN" "$COOLIFY_ENDPOINT/servers" \
  | jq -r '.[] | "\(.name) \(.ip)"'
```

## Sauvegarde de l'instance Coolify

Les backups configurés dans Coolify couvrent les bases des applications, pas Coolify
lui-même. Sa base porte pourtant toute la configuration des quatre environnements
(applications, variables, secrets). L'`apply` de `infra/coolify` installe donc sur le
control plane un timer systemd (`tet-coolify-backup.timer`, quotidien) qui :

1. fait un `pg_dump` de `coolify-db` et copie `/data/coolify/source/.env` (qui porte
   l'`APP_KEY`, sans laquelle la base restaurée est illisible) ;
2. chiffre l'archive avec [age](https://age-encryption.org) vers les clés publiques des
   opérateurs ;
3. l'envoie sur le bucket de backups, sous `coolify-instance/`. La rétention
   (30 jours par défaut) est une règle de cycle de vie du bucket, dans `infra/platform`.

Base + `APP_KEY` = tous les secrets de tous les environnements : le serveur ne détient
aucune clé privée age, et un backup lu sur le bucket est inexploitable sans elle.

### Clés age des opérateurs (une fois par opérateur)

```sh
age-keygen -o ~/tet-coolify-backup.key   # affiche la clé publique (age1…)
```

Ranger la clé privée dans le gestionnaire de mots de passe de l'équipe, **hors** Scaleway :
un backup doit rester restaurable si le projet Scaleway est compromis ou perdu. Ajouter la
clé publique à `instance_backup_age_recipients` dans `coolify/terraform.tfvars`, puis
`apply` : les backups suivants sont chiffrés pour la nouvelle liste. Les anciens restent
lisibles uniquement par les clés de l'époque.

Le premier `apply` lance un backup immédiat et échoue si la chaîne est cassée. Ensuite :

```sh
ssh tet-ops@<ip-coolify> 'sudo systemctl list-timers tet-coolify-backup.timer'
ssh tet-ops@<ip-coolify> 'sudo journalctl -u tet-coolify-backup.service -n 20'
```

### Restauration

Procédure Coolify officielle ([instance-restore](https://github.com/coollabsio/coolify-docs/blob/main/content/docs/core/backup-and-recovery/instance-restore.mdx)),
appliquée à nos archives :

```sh
# 1. Récupérer et déchiffrer la dernière archive (poste opérateur).
#    Le bucket vit dans le projet tet-backups : utiliser sa clé dédiée, que l'API S3
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

## Migration du state preprod (une fois)

Avant le passage à un Coolify dédié, preprod avait son propre stack (`infra/preprod`, state
`tet-preprod-tfstate/preprod/terraform.tfstate`) : Postgres `tet-preprod-pg`, Redis
`tet-preprod-redis`, et une VM portant à la fois Coolify et les applis. `nonprod` déclare
les mêmes instances : **ne jamais l'appliquer avant cette migration**, il créerait des
bases neuves et vides à côté des anciennes.

La bascule coupe l'accès des applis de l'ancien Coolify à la base : à faire dans une
fenêtre de maintenance, une fois les applis preprod prêtes sur le nouveau Coolify.

```sh
source infra/scripts/tf-env.sh
terraform -chdir=infra/nonprod init

# 1. Adopter les bases existantes (dry-run, puis exécution)
infra/scripts/migrate-preprod-state.sh
CONFIRM=yes infra/scripts/migrate-preprod-state.sh

# 2. Relire le plan AVANT tout apply
terraform -chdir=infra/nonprod plan -out=tfplan
```

Le plan doit montrer, pour `tet-preprod-pg` et `tet-preprod-redis`, des **update
in-place** et jamais un `replace` : sinon, s'arrêter. Changements attendus :

- `private_network` : bascule de l'ancien PN `tet-preprod-pn` vers le PN nonprod. Les IP
  privées des bases changent ;
- mots de passe admin PG/Redis et `supabase_auth_admin` **régénérés**. Les anciens
  contenaient `#`, `?` et `%`, qui cassaient les URI, et les importer aurait exposé
  leur valeur sur la ligne de commande ;
- endpoint public PG : conservé si `pg_allowed_ips` est renseigné, supprimé sinon ;
- tags, et la création du serveur, des DNS et des secrets nonprod.

```sh
# 3. Appliquer, puis reporter les nouvelles URI dans les variables Coolify de tet-preprod
terraform -chdir=infra/nonprod apply tfplan
terraform -chdir=infra/nonprod output -raw pg_private_connection_uri
```

Le script sauvegarde les deux states dans `infra/.state-backups/` (gitignoré, `0600`)
avant toute modification. Retour arrière avant l'apply : `terraform state push` de ces
copies.

### Décommissionner l'ancien stack preprod

Une fois preprod servi par le nouveau Coolify, il reste dans l'ancien state la VM
`tet-preprod-coolify`, son IP, son security group, le VPC `tet-preprod`, le PN
`tet-preprod-pn`, le secret de sa clé host et le bucket vide `tet-preprod-coolify-backups`.
On les détruit avec le code de l'époque :

```sh
git worktree add /tmp/tet-preprod-old bfedd1527^
cp infra/preprod/terraform.tfvars /tmp/tet-preprod-old/infra/preprod/
terraform -chdir=/tmp/tet-preprod-old/infra/preprod init
terraform -chdir=/tmp/tet-preprod-old/infra/preprod plan -destroy   # ni PG ni Redis dans la liste
terraform -chdir=/tmp/tet-preprod-old/infra/preprod apply -destroy
git worktree remove /tmp/tet-preprod-old
```

Supprimer ensuite le state `coolify-preprod`, qui ne décrit que l'ancienne instance
Coolify, puis le bucket `tet-preprod-tfstate` et les dossiers locaux `infra/preprod/` et
`infra/coolify-preprod/` (tfvars et `tfplan` obsolètes, gitignorés).

## State backend : locking natif

Le backend S3 utilise `use_lockfile = true` (Terraform >= 1.10). Lors de chaque `plan` ou `apply`, Terraform écrit un fichier `.tflock` dans le bucket via un **conditional write S3** (`If-None-Match: *`) : si le fichier existe déjà, l'opération échoue immédiatement avec un message d'erreur explicite, ce qui empêche deux applies simultanés.

Ce mécanisme repose sur le support des conditional writes par Scaleway Object Storage, activé depuis mai 2026 via la feature **Object Lock** — d'où la nécessité d'activer Object Lock sur le bucket lors du bootstrap.

> **En cas de lock fantôme** (apply interrompu brutalement sans libérer le lock) :
>
> ```sh
> # Identifier le fichier de lock (adapter le préfixe au stack concerné)
> aws s3 ls --endpoint-url https://s3.fr-par.scw.cloud s3://tet-tfstate/platform/
> # Le supprimer manuellement après vérification qu'aucun apply n'est en cours
> aws s3 rm --endpoint-url https://s3.fr-par.scw.cloud s3://tet-tfstate/platform/terraform.tfstate.tflock
> ```

## Hygiène

```sh
# Formatage cohérent
terraform fmt -recursive

# Validation syntaxe / typage, sur chaque stack
for d in platform nonprod prod preview coolify; do
  terraform -chdir=$d init -backend=false && terraform -chdir=$d validate
done

# Linting (à installer : https://github.com/terraform-linters/tflint)
tflint --recursive
```

Le lockfile `.terraform.lock.hcl` de chaque stack **doit être versionné** — il fige les
versions exactes des providers et garantit la reproductibilité.

## CI/CD (à venir)

Workflow `.github/workflows/ci-infra.yml` à créer :

- Déclenchement sur PR si `infra/**` est modifié
- `terraform fmt -check` + `terraform validate` + `terraform plan` en commentaire de PR
- Sur merge `main`, `terraform apply` avec approbation manuelle (GitHub Environments)
- Authentification Scaleway via OIDC GitHub → IAM Scaleway (pas de clés long-lived dans les secrets repo)

## Décisions architecturales actées

- **Instance Coolify dédiée et transverse** : le control plane ne partage ni CPU, ni disque, ni cycle de vie avec les applications, et pilote tous les environnements
- **Production dans un projet Scaleway séparé**, avec son propre VPC et aucun lien réseau avec le VPC partagé : prod injoignable depuis nonprod et preview par construction, pas par filtrage. Pas de VPC Peering : il réintroduirait un chemin qu'il faudrait filtrer par quatre ACL (IPv4/IPv6 des deux côtés)
- **SSH des serveurs applicatifs** : privé uniquement pour nonprod et preview ; IP publique limitée à l'IP du control plane pour la prod. Le control plane sert de bastion dans tous les cas
- **Backups dans un projet Scaleway dédié**, bucket sous Object Lock COMPLIANCE : la clé des backups ne voit que ce projet
- **preprod iso-prod sur du managé**, staging et preview conteneurisés : le gate avant production doit reproduire la contrainte non-superuser de RDB
- **Mono-VM Coolify par tier** plutôt que Kapsule (cf. brainstorm) : pas d'orchestrateur K8s
- **State backend S3 Scaleway avec locking natif** : `use_lockfile = true` via conditional writes S3 (Object Lock Scaleway, mai 2026)
- **Un state par stack**, liés par valeurs et noms de secrets — jamais par `terraform_remote_state`
- **GoTrue self-hosté** plutôt que self-hosting complet de Supabase : préserve JWT_SECRET, schéma auth, bcrypt
- **Sous-domaines dédiés par service** plutôt que reverse proxy unique
- **Stratégie de bascule DB** : `pg_dump` / `pg_restore` en maintenance window, **pas** de réplication logique
