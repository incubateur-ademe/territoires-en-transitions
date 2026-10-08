---
title: "infra: Applications Coolify as code, de preprod à la prod"
type: infra
status: plan
date: 2026-10-06
---

# Applications Coolify as code

## Point de départ

L'infra est en place et Coolify (4.3.19) la voit entièrement :

| Objet | État |
|---|---|
| Serveurs `tet-nonprod-apps`, `tet-prod-apps`, `tet-preview-apps` | joignables, Traefik démarré, marqueur `[tet-server:<tier>]` |
| Projets `tet-preprod`, `tet-staging`, `tet-prod`, `tet-preview` | créés par `infra/coolify`, un environnement `production` chacun |
| Applications, services, bases | **aucun** |

Reste à mettre les applications dedans, avec le moins de clics possible. La règle de
partage retenue :

| Qui | Possède | Mécanisme |
|---|---|---|
| Terraform (`infra/coolify`) | la **forme** : image, domaines, port, healthcheck, serveur, projet | `applications.tf` → `coolify-upsert-application.sh` |
| Terraform + Secret Manager | la **configuration** : variables d'environnement | plan [`2026-09-25-001`](2026-09-25-001-infra-env-vars-secret-manager-vers-coolify-plan.md) |
| La CD (GitHub Actions) | la **version** : tag d'image | `coolify-deploy.sh` (PATCH du tag + `POST /deploy`) |

Terraform ne pose le tag qu'à la création : un `apply` ne peut jamais ramener une
application à une version antérieure. La CD retrouve l'application par son marqueur
`[tet-app:<env>/<app>]` : aucun UUID à recopier, ni dans `terraform.tfvars`, ni dans les
secrets GitHub. Ça règle au passage le piège 10 du plan des variables (« UUID posés à la
main »).

Le provider `sierrajc/coolify` 0.10.2 n'a pas de ressource `coolify_application` ni de base
Redis. On reste donc sur le pattern `terraform_data` + script d'API déjà utilisé pour les
serveurs (cf. la décision du 2026-10-02 de ne pas passer à `coolify-terraform/coolify`).

## Étape 0 — DNS (prérequis, manuel)

Aujourd'hui `app.preprod`, `api.preprod` et `supabase-api.preprod` pointent encore sur
l'ancienne VM preprod (`212.47.244.102`), et aucun nom `*.staging` / `*.preview` ne résout.
Tant que c'est le cas, Traefik ne peut pas obtenir de certificat Let's Encrypt (HTTP-01).

1. `scw domain external-domain register domain=territoiresentransitions.fr` (une fois).
2. `dns_enabled = true` dans `platform/terraform.tfvars`, apply, puis poser chez le
   registrar les NS donnés par `terraform -chdir=infra/platform output -json dns_zone_nameservers`.
3. `dns_enabled = true` dans `nonprod/` et `preview/`, apply : wildcard + apex vers l'IP
   publique du serveur du tier.

*Vérif* : `dig +short app.preprod.territoiresentransitions.fr` renvoie l'IP de
`tet-nonprod-apps` (`terraform -chdir=infra/nonprod output -raw server_public_ip`).

## Étape 1 — Déclarer les applications preprod (fait dans ce changement)

- `infra/coolify/applications.tf` : catalogue des applications (`app`, `backend`, `site`)
  × environnements (`preprod`, `staging`, `prod`), filtré par
  `var.application_environments` (défaut `["preprod"]`).
- `infra/scripts/coolify-upsert-application.sh` : `POST /applications/dockerimage` avec
  `instant_deploy: false`, ou `PATCH /applications/{uuid}`. Le tag n'est envoyé qu'à la
  création.

```sh
source infra/scripts/tf-env.sh && source infra/scripts/coolify-env.sh
cd infra/coolify
terraform plan -out=tfplan     # attendu : 3 to add (preprod/app, preprod/backend, preprod/site)
terraform apply tfplan
terraform plan                 # attendu : No changes
```

Rien ne démarre : sans variables, `apps/app` crash-loope au boot (`validateRuntimeEnv`), et
le backend aussi (`backendConfigurationSchema`). C'est voulu, le premier déploiement vient
à l'étape 3.

## Étape 2 — Variables d'environnement

Suivre le plan [`2026-09-25-001`](2026-09-25-001-infra-env-vars-secret-manager-vers-coolify-plan.md),
avec trois corrections apprises depuis :

1. **Endpoint des variables partagées.** En 4.3.19, il n'y a pas de `/projects/{uuid}/envs` :
   c'est `/projects/{uuid}/environments/{env}/envs` (`env` = `production`). C'était le repli
   prévu au piège 11 du plan ; il devient le chemin par défaut.
2. **Plus d'UUID d'application dans les tfvars.** `coolify-push-env.sh` résout
   l'application par le marqueur `[tet-app:<env>/<app>]`, exactement comme
   `coolify-deploy.sh`. Le push dépend de `terraform_data.application[...]`.
3. **Le piège 5 (caractères réservés dans l'URI Postgres) est déjà corrigé** :
   `modules/postgres` restreint `override_special` à `-_.!*~`.

## Étape 3 — Premier déploiement preprod, à la main

Choisir un SHA déjà publié sur GHCR par `cd-app.yml` / `cd-backend.yml` / `cd-site.yml`,
puis :

```sh
source infra/scripts/tf-env.sh && source infra/scripts/coolify-env.sh
for a in backend app site; do
  APP_ID=preprod/$a IMAGE_TAG=<sha> infra/scripts/coolify-deploy.sh
done
```

Le script échoue si le déploiement échoue ou dépasse 15 minutes. Vérifs : `/version` du
backend, `/api/version` de l'app (SHA attendu, pas une valeur figée), CSP de l'app qui
contient les URL Supabase et backend (étape 0 du plan des variables).

## Étape 4 — supabase-api en service Coolify

La stack `infra/nonprod/supabase-api/docker-compose.yml` est aujourd'hui « à coller dans
l'UI ». Pour la coder :

- `POST /services` (ou la ressource `coolify_service` du provider) avec
  `docker_compose_raw` rendu par `templatefile()` : `STACK_ENV` et `SUPABASE_API_HOST`
  deviennent des valeurs Terraform par environnement ;
- les templates d'email montés depuis `./templates/` n'existent pas sur le serveur : les
  embarquer via la clé `content:` des volumes, propre à Coolify, alimentée par `file()` ;
- marqueur `[tet-service:<env>/supabase-api]` et script d'upsert jumeau de celui des
  applications ;
- ses variables passent par le même manifeste (`/services/{uuid}/envs`).

Corriger avant : l'URL `http://localhost:3003` en dur dans `templates/confirmation.html`
(piège 14 du plan des variables).

## Étape 5 — Basculer la CD preprod de Koyeb vers Coolify

Dans `cd-app.yml`, `cd-backend.yml`, `cd-site.yml`, remplacer pour `target == preprod`
l'étape `koyeb services update` par :

```yaml
- name: Déploie sur Coolify
  env:
    COOLIFY_ENDPOINT: ${{ vars.COOLIFY_ENDPOINT }}
    COOLIFY_TOKEN: ${{ secrets.COOLIFY_DEPLOY_TOKEN }}
    APP_ID: ${{ github.event.inputs.target }}/app
    IMAGE_TAG: ${{ steps.meta.outputs.git-short-hash }}
  run: infra/scripts/coolify-deploy.sh
```

- Token Coolify **dédié à la CI**, permissions `write` + `deploy` (le PATCH du tag exige
  `write`), jamais `root`. Un par environnement GitHub, rangé dans `COOLIFY_DEPLOY_TOKEN`.
- Les `--env` passés à Koyeb disparaissent : la configuration vit dans Coolify (étape 2).
  `DEPLOYMENT_TIMESTAMP` est le seul cas à part : il change à chaque déploiement, il ne
  peut pas vivre dans le manifeste. À poser par la CD juste avant le deploy, ou à
  abandonner au profit de la date de création du conteneur.
- Garder Koyeb pour `staging` et `prod` tant que leurs étapes ne sont pas faites.

## Étape 6 — Staging

Staging tourne sur `tet-nonprod-apps` avec Postgres et Redis **conteneurisés**.

1. Bases : `POST /databases/postgresql` et `POST /databases/redis` dans `tet-staging`,
   par un script d'upsert à marqueur `[tet-db:staging/postgres]`. Mot de passe généré par
   `random_password`, rangé dans Secret Manager, passé au script par nom de secret (pas
   par valeur). Pas de port public : les applications du même serveur les joignent par le
   réseau Docker de Coolify.
2. Backup planifié vers le S3 storage `tet-scaleway-s3` (`POST /databases/{uuid}/backups`).
3. `application_environments = ["preprod", "staging"]`, apply, variables staging, puis
   bascule de la CD staging.

## Étape 7 — Previews

Les applications « image Docker » acceptent les déploiements de preview :
`POST /deploy?uuid=…&pull_request_id=<n>&docker_tag=<sha>`, servis selon
`preview_url_template` (ex. `{{pr_id}}.preview.territoiresentransitions.fr`, couvert par
le wildcard de `infra/preview`). Ça remplacerait `deploy-test-app` (Koyeb) et
`cd-test-app-destroy.yml` (`DELETE /applications/{uuid}/previews/{pr}`).

À trancher avant : une preview a besoin d'une base. Soit une base partagée par toutes les
previews (simple, mais les migrations d'une PR cassent les autres), soit une base par PR
(isolée, mais il faut l'amorcer avec `prepare-test-db`). Proposition : base partagée
d'abord, réinitialisée chaque nuit.

## Étape 8 — Production, à la bascule

`application_environments` reçoit `prod` **le jour de la bascule** seulement, après le
passage des noms de prod chez le registrar vers `tet-prod-apps`. Avant, Traefik tenterait
des certificats sur des noms qui pointent vers Koyeb. Le reste suit la procédure de bascule
du brainstorm (`2026-05-15-001`).

## Ce qui reste hors Terraform, volontairement

- **Le tag d'image** : possédé par la CD.
- **La suppression d'une application** : retirer une entrée du catalogue ne la supprime
  pas de Coolify. La suppression reste un geste explicite dans l'UI, à faire après avoir
  vérifié qu'elle ne sert plus. Si ça devient fréquent, ajouter un `terraform_data` de
  présence à provisioner de destruction, sur le modèle de `server_registration`.
- **`apps/tools`** : ni domaine ni inventaire des variables. À ajouter au catalogue une
  fois ces deux points connus.

## Fichiers

```
infra/coolify/applications.tf                 catalogue env × app, upsert
infra/coolify/variables.tf                    application_environments, application_initial_image_tag
infra/coolify/outputs.tf                      application_ids
infra/scripts/coolify-upsert-application.sh   POST/PATCH /applications, marqueur [tet-app:…]
infra/scripts/coolify-deploy.sh               PATCH du tag + POST /deploy + attente
```
