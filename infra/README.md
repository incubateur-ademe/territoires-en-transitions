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
│                      + scripts d'API (push-env, deploy, ghcr-docker-login,
│                        configure-s3-storage, upsert-server pour localhost)
├── platform/          Socle transverse : VPC, ACL, DNS, VM Coolify, buckets
├── prod/              Serveur prod + RDB prod + Redis prod
├── nonprod/           Serveur mutualisé + RDB preprod + Redis preprod
│   ├── supabase-api/  Stack Docker Compose GoTrue + Storage (déployée par coolify/services.tf)
│   └── Makefile       Bootstrap SQL des rôles GoTrue
├── preview/           Serveur preview
└── coolify/           Coolify-as-code : clés, serveurs, projet et environnements, S3 storage
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
- `SCW_DEFAULT_ORGANIZATION_ID` — default pour les appels API

`SCW_DEFAULT_PROJECT_ID` n'est pas exporté (et est même retiré du shell) : le provider donne priorité à cette variable sur le `project_id` déclaré dans chaque stack, qui ciblerait alors le mauvais projet.

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

Les clés d'hôte SSH des serveurs sont générées par Terraform et installées par cloud-init
au premier boot : elles sont connues avant toute connexion. Les scripts de `infra/coolify`
les vérifient en mode strict. Côté opérateur, les épingler une fois dans `known_hosts`
plutôt que d'accepter la première clé présentée :

```sh
{
  echo "$(terraform -chdir=infra/platform output -raw coolify_public_ip) $(terraform -chdir=infra/platform output -raw coolify_sshd_host_public_key)"
  for t in nonprod preview; do
    echo "$(terraform -chdir=infra/$t output -raw server_private_ip) $(terraform -chdir=infra/$t output -raw server_sshd_host_public_key)"
  done
  echo "$(terraform -chdir=infra/prod output -raw server_ssh_host) $(terraform -chdir=infra/prod output -raw server_sshd_host_public_key)"
} >> ~/.ssh/known_hosts
```

Un « REMOTE HOST IDENTIFICATION HAS CHANGED » ensuite n'est jamais anodin : soit le serveur
a été recréé (mettre à jour la ligne), soit la connexion est interceptée.

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
   `ssh -L 8000:localhost:8000 -L 6001:localhost:6001 -L 6002:localhost:6002 tet-ops@<ip-coolify>`
   puis http://localhost:8000. Les ports 6001 (temps réel) et 6002 (terminal) évitent
   l'avertissement « Cannot connect to real-time service » ; une fois le FQDN actif, ils
   passent par le 443.
3. Créer le compte admin, puis démarrer le proxy : **Servers → localhost** (**Validate &
   configure** s'il n'est pas validé) → onglet **Proxy** → **Traefik** → **Start Proxy**.
   Sans ce conteneur `coolify-proxy`, rien n'écoute sur 80/443 : le FQDN répond
   « connection reset ».
4. **Settings → Instance Domain** → le FQDN. Coolify déclenche l'émission du certificat
   Let's Encrypt (challenge HTTP-01 sur le port 80, ouvert au monde par le security
   group).

`APP_URL` est déjà aligné sur le FQDN par cloud-init, mais le routage Traefik dépend du
réglage « Instance Domain », stocké en base : les étapes 3 et 4 restent manuelles.

## DNS

Tout reste chez Cloudflare, hors Terraform : l'apex, les noms de production et les
enregistrements non-prod, posés à la main en **DNS only** (pas de proxy : Traefik émet
lui-même ses certificats Let's Encrypt en HTTP-01) :

| Nom | Type | Cible |
|---|---|---|
| `preprod`, `*.preprod`, `staging`, `*.staging` | A | IP publique de nonprod (`terraform -chdir=infra/nonprod output -raw server_public_ip`) |
| `preview`, `*.preview` | A | IP publique de preview (`terraform -chdir=infra/preview output -raw server_public_ip`) |

À reporter à la main si un serveur est recréé avec une autre IP.

Pas de sous-zones déléguées à Scaleway Domains : un domaine externe dont l'apex ne pointe
pas sur les NS de Scaleway y est supprimé au bout de 14 jours, ses zones avec (incident du
2026-10-23). À reconsidérer après la migration de la prod.

## Couche Coolify-as-code (`infra/coolify/`)

Configuration de l'instance Coolify (clés, serveurs, projet et environnements, applications,
S3 storage) via le provider communautaire
[`coolify-terraform/coolify`](https://registry.terraform.io/providers/coolify-terraform/coolify)
et, quand il ne convient pas, des appels API directs.

Ressources natives : `coolify_private_key`, `coolify_project`, `coolify_environment`,
`coolify_server`, `coolify_application_docker_image`. Le `plan` y détecte le drift (un
domaine changé dans l'UI, par exemple).

Restent en scripts d'API, par choix : les **variables d'environnement**, le **S3 storage** et
le **login GHCR**. Le provider stocke chaque secret qu'il gère dans le state (aucun attribut
write-only), et son API « bulk » d'env vars ignore `is_multiline`/`is_literal`. Les scripts
lisent Secret Manager à l'apply et n'écrivent rien dans le state (R4). À revisiter si le
provider gagne des attributs `*_wo`.

> ⚠️ Deux ressources suppriment **en cascade** : `coolify_server` (le provider appelle
> `DELETE /servers/{uuid}?force=true`, qui emporte les applications et bases du serveur) et
> `coolify_environment`. Les deux portent `prevent_destroy`. Retirer un tier de `app_servers`
> ou un environnement est donc un geste en deux temps, comme pour les secrets :
> `terraform state rm` de la ressource, puis suppression dans l'UI, qui refuse tant qu'il
> reste des ressources dessus.

Le serveur `localhost` (control plane) reste hors de `coolify_server` : Coolify l'a créé à
l'install, on ne fait que lui substituer sa clé par
[`scripts/coolify-upsert-server.sh`](scripts/coolify-upsert-server.sh).

#### Bascule de provider (faite le 2026-10-13, conservé pour mémoire)

Les serveurs, environnements et applications créés par les anciens scripts ont été **adoptés**
par des blocs `import` dans `coolify/imports.tf`, supprimé après l'apply (cf. historique git).
Clés et projet changent de provider sans réimport :

```sh
source infra/scripts/coolify-env.sh
cd infra/coolify
terraform init -upgrade
terraform state replace-provider registry.terraform.io/sierrajc/coolify registry.terraform.io/coolify-terraform/coolify
terraform plan   # attendu : 9 imports, 0 update sur serveurs/envs/apps, env_push rejoués
terraform apply
git rm imports.tf
```

Un `update` sur un serveur, un environnement ou une application au premier `plan` est un
champ mal mappé ou une valeur posée dans l'UI : corriger le HCL, ne pas forcer.
`private_key_uuid` n'est pas renvoyé par l'API : le HCL doit porter le même UUID que le
serveur (c'est le cas, il vient de `coolify_private_key.server`), sinon le provider pose une
nouvelle clé.

### Bootstrap du token API (une fois)

Les tokens API Coolify se créent **uniquement dans l'UI** :

1. Coolify → **Security → API Tokens** → créer un token **scope `root`**
   (nécessaire pour gérer serveurs + clés + projets + env vars).
2. Le stocker dans Secret Manager :
   ```sh
   _id="$(scw secret secret create name=tet-platform-coolify-api-token \
     project-id=<projet-principal> -o json | jq -r .id)"
   scw secret version create "$_id" data='<id>|<token>'
   ```

### Bootstrap des credentials GHCR (une fois)

Coolify tire les images privées `ghcr.io/incubateur-ademe/*` via Docker sur chaque
serveur applicatif (`root`). Il n'existe pas d'API Coolify pour ça : on automatise
l'écriture de `/root/.docker/config.json` (auth inline) depuis Terraform
([`scripts/coolify-ghcr-docker-login.sh`](scripts/coolify-ghcr-docker-login.sh)). Coolify
monte ce fichier dans `coolify-helper` uniquement s'il existe pour `$HOME` du user SSH —
un `docker pull` réussi sur l'hôte ne suffit pas.

Le script passe par le bastion : les serveurs applicatifs n'ont pas de SSH public.

1. Créer un PAT GitHub **classic** avec le seul scope `read:packages` — idéalement sur un
   **machine user** dédié. Pas de fine-grained : GHCR ne les accepte pas, `docker login`
   réussit mais tout pull répond `denied`. Si l'org impose le SSO, autoriser le PAT
   (*Configure SSO → Authorize*). Pour vérifier :
   `curl -sI -H "Authorization: token <pat>" https://api.github.com/user | grep -i x-oauth-scopes`
   doit lister `read:packages`.
2. Le stocker dans Secret Manager au format `username|token`. Un seul secret pour tous les
   serveurs :
   ```sh
   _id="$(scw secret secret create name=tet-platform-ghcr-pull \
     project-id=<projet-principal> -o json | jq -r .id)"
   scw secret version create "$_id" data='<github-username>|<pat>'
   ```

Après rotation du PAT : créer une nouvelle version du secret, puis incrémenter
`ghcr_pull_credentials_revision` dans `coolify/terraform.tfvars` et appliquer :
```sh
_id="$(scw secret secret list name=tet-platform-ghcr-pull project-id=<projet-principal> -o json | jq -r '.[0].id')"
printf '%s|%s' '<github-username>' '<pat>' | scw secret version create "$_id" data=@/dev/stdin
```

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
_id="$(scw secret secret list name=tet-platform-coolify-s3-credentials \
  project-id=<projet-principal> -o json | jq -r '.[0].id')"
scw secret version create "$_id" data='SCWXXXX|<secret_key>'
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
projets, (6) crée/met à jour le S3 storage Scaleway et le valide, (7) déclare les
applications des environnements listés dans `application_environments`.

Vérifier que Coolify voit bien tous ses serveurs :

```sh
curl -sH "Authorization: Bearer $COOLIFY_TOKEN" "$COOLIFY_ENDPOINT/servers" \
  | jq -r '.[] | "\(.name) \(.ip)"'
```

### Applications

[`coolify/applications.tf`](coolify/applications.tf) déclare les applications « image
Docker » (`app`, `backend`, `site`) de chaque environnement : image, domaines, port,
healthcheck (`coolify_application_docker_image`). Leur description porte le marqueur
`[tet-app:<env>/<app>]` par lequel `coolify-push-env.sh` et `coolify-deploy.sh` les
retrouvent : la CD n'a besoin d'aucun UUID.

Le **tag d'image n'appartient pas à Terraform**, qui ne le pose qu'à la création, sans
déployer, puis l'ignore (`ignore_changes`). C'est la CD qui choisit la version :

```sh
APP_ID=preprod/app IMAGE_TAG=<sha> infra/scripts/coolify-deploy.sh
```

Les environnements s'ouvrent un par un via `application_environments` (défaut
`["preprod"]`). Retirer une application du catalogue ne la supprime pas de Coolify. Feuille
de route complète : [`doc/plans/2026-10-06-001-infra-applications-coolify-as-code-plan.md`](../doc/plans/2026-10-06-001-infra-applications-coolify-as-code-plan.md).

### Variables d'environnement (Secret Manager → Coolify)

[`coolify/env-manifest.tf`](coolify/env-manifest.tf) liste, par environnement et par
application, chaque variable : valeur en clair (`value`), ou nom d'un secret (`secret`)
rangé sous `/coolify-env/<env>/tet-<env>-<nom>`. L'`apply` pousse chaque application par
[`scripts/coolify-push-env.sh`](scripts/coolify-push-env.sh), qui résout toutes les valeurs
**avant** d'écrire : un secret manquant fait échouer l'apply sans rien modifier, avec la
liste de ce qui manque. Aucune valeur secrète n'entre dans le state.

| Secret | Créé par | Valeur déposée par |
| --- | --- | --- |
| Dérivés de l'infra (URI Postgres, URI et CA Redis) | stack du tier (`nonprod/coolify-env-secrets.tf`) | Terraform |
| Applicatifs (clés Supabase, Brevo, Google…) | `coolify/env-secrets.tf` (coquille vide) | un opérateur |

Déposer une valeur, puis la pousser :

```sh
terraform -chdir=infra/coolify output env_manual_secrets   # ce qui est attendu
infra/scripts/coolify-env-secret-set.sh preprod brevo-api-key < brevo.txt
# compte de service Google : JSON compacté sur une ligne
jq -c . sa.json | infra/scripts/coolify-env-secret-set.sh preprod gcloud-service-account-key
# puis incrémenter coolify_env_revision dans coolify/terraform.tfvars et appliquer
```

Règles :

- **le manifeste fait autorité** : `coolify_env_prune = true` (défaut) supprime de Coolify
  toute variable absente du manifeste. Une variable ajoutée dans l'UI disparaît au prochain
  push ;
- **jamais** de clé fournie par l'image (`GIT_SHORT_HASH`, `APPLICATION_VERSION`,
  `NODE_ENV`, `PORT`, `HOSTNAME`…), ni de `NEXT_PUBLIC_*`, ni de valeur en clair sur une clé
  au nom sensible : des préconditions bloquent le plan ;
- **pousser ne redéploie pas** : les variables sont lues au démarrage. Redéployer avec
  `infra/scripts/coolify-deploy.sh` ;
- **ajouter une clé** : une ligne dans le manifeste ; si c'est un secret, `apply` crée sa
  coquille puis échoue en la signalant vide. Déposer la valeur, réappliquer.

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

## Base de données : restauration complète et bascule

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
l'image déployée (`auth.schema_migrations`, `storage.migrations`). Il s'arrête en échec s'il a rencontré des erreurs : le journal,
indiqué en fin de sortie, les liste (`grep -n 'error:'`). Les données de `client_scores`,
`pre_audit_scores` et `post_audit_scores`, et celles des vues matérialisées que supprime
`evaluation/drop_client_scores_dependances`, ne sont pas reprises : leurs définitions si (`_skip_data`). Une entrée du sommaire à écarter en
plus : `EXCLUDE_REGEX='…'`. Rejouable : chaque passage repart de zéro.

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

**Point à vérifier** — **droits** : le dump est pris en `--no-acl`. Le backend, propriétaire de tout, n'en souffre
  pas ; une politique RLS de `storage.objects` qui lit une table applicative sans
  `security definer` échouerait pour `authenticated`. C'est ce que vérifie le téléchargement
  d'une preuve à l'étape 7.

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
en service. Les répétitions sur la RDB prod avant la bascule passent. Séquence complète (TTL DNS, fenêtre de maintenance, garde de
Supabase Cloud en lecture seule pendant 14 jours, rollback) : section « Stratégie de
bascule » de `doc/plans/2026-05-15-001-migration-infra-supabase-koyeb-vers-scaleway-coolify.md`.

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
