---
title: "infra: Variables d'environnement Scaleway Secret Manager vers Coolify"
type: infra
status: plan
date: 2026-09-25
---

# Variables d'environnement : Scaleway Secret Manager → Coolify

## Overview

Les images Docker sont prêtes, mais aucun chemin automatisé n'alimente les conteneurs en
variables d'environnement. Aujourd'hui c'est du copier-coller :
`infra/preprod/supabase-api/.env.example` dit « à reporter dans l'onglet Environment
Variables du Compose dans Coolify », et `infra/preprod/Makefile` termine par un `echo` de la
`DATABASE_URL` GoTrue à recopier à la main.

Deux trous à fermer :

1. **Valeurs dérivées de l'infra** (URI Postgres, IP privée Redis, mot de passe
   `supabase_auth_admin`) : elles ne vivent que comme outputs sensibles du state
   `infra/preprod`. Les modules `postgres` et `redis` le documentent eux-mêmes — « À stocker
   immédiatement dans Scaleway Secret Manager après le premier apply » — geste jamais codé.
2. **Secrets applicatifs** (Brevo, ProConnect, Mon Compte ADEME, Google) : ils n'ont aucun
   domicile. Ils sont dans `apps/*/.env` chiffrés par dotenvx, qui ne servent qu'au dev local
   (le `.dockerignore` les exclut du contexte de build).

Cible : Secret Manager source de vérité, Terraform le tuyau, Coolify la cible de livraison —
en réutilisant les patterns déjà en place dans `infra/coolify-preprod/`.

Périmètre : `apps/app`, `apps/backend`, stack `supabase-api` (gotrue + storage).
Hors périmètre : `apps/site` (toujours inliné au build), `apps/tools` (aucun `ARG` applicatif,
à inventorier avant déploiement).

## Ce que le passage à la config runtime change

Le commit `f136ede51` (« une seule image par commit, la config arrive au runtime ») a supprimé
les `ARG` applicatifs de `apps/app/Dockerfile`. Le mécanisme est dans
`packages/api/src/public-env.ts` : lecture par indexation dynamique `process.env[key]` — que le
bundler ne sait pas inliner — puis publication au navigateur via `window.__TET_PUBLIC_ENV__`,
posé par le layout racine (`apps/app/app/public-env.script.tsx`).

**Le frontend entre dans le périmètre**, avec 12 variables à fournir : les 9 publiques
(`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `BACKEND_URL`, `APP_URL`, `SITE_URL`, `SENTRY_DSN`,
`CRISP_WEBSITE_ID`, `ENV_NAME`, `LOG_ACTION_DURATION`) et 3 côté serveur
(`ALLOWED_ORIGIN_PATTERN`, `POSTHOG_HOST`, `POSTHOG_KEY`).

**Les shared vars deviennent utiles.** Les variables sont lues **sans préfixe
`NEXT_PUBLIC_`** : backend et frontend partagent désormais des clés de même nom et même
valeur.

**Une clé manquante fait crash-looper le conteneur.** `apps/app/instrumentation.ts` appelle
`validateRuntimeEnv()` au démarrage Node ; le schéma
(`apps/app/src/utils/runtime-env/validate-runtime-env.ts`) exige :

```ts
SUPABASE_URL: z.string().url(),
SUPABASE_ANON_KEY: z.string().min(1),
BACKEND_URL: z.string().url(),
APP_URL: z.string().url(),
ENV_NAME: z.string().min(1),
```

Le commentaire du fichier l'acte : « L'inlining `NEXT_PUBLIC_*` faisait office de filet […]
ce filet a disparu ». Conséquence : pousser les variables **avant** le premier déploiement
n'est plus une bonne pratique mais une condition de démarrage. Contrepartie heureuse : les
trois `z.string().url()` font du conteneur un **oracle gratuit** pour la question ouverte des
shared vars (§ Étape 4).

## Décisions structurantes

**Conformité R4 — et une tension à trancher.** Le brainstorm
(`doc/plans/2026-05-15-001-migration-infra-supabase-koyeb-vers-scaleway-coolify.md:58`) pose :
secrets « stockés dans Scaleway Secret Manager et **référencés par data sources Terraform**.
Ils ne figurent jamais en clair dans le repo **ni dans le state**. » Les deux moitiés sont
incompatibles : une `data "scaleway_secret_version"` écrit sa valeur dans le state. Ce plan
honore l'intention (rien de sensible dans le state) plutôt que la lettre — d'où la résolution
des valeurs par script à l'apply. À noter : `coolify_private_key.host` viole déjà cette règle
(la clé SSH privée transite par une data source et atterrit dans le state B). Ce plan
n'aggrave pas ; corriger est un chantier distinct.

Corollaire acté par le brainstorm (ligne 262) : la base interne de Coolify contient toutes les
env vars et doit être sauvegardée séparément. C'est pourquoi elle ne peut pas être source de
vérité — Secret Manager l'est, Coolify n'en est qu'un réplica.

**Pont inter-stack : `scaleway_secret` dans `infra/preprod`, pas de `terraform_remote_state`.**
On garde la convention : entre stacks on passe des *noms* de secrets, jamais des valeurs.

**Layout SM : un secret par variable, regroupés par `path`.** `scaleway_secret` accepte
`path` (défaut `/`). Rotation et IAM par variable, révision indépendante.

**Manifeste : mapping explicite `{ CLÉ_ENV = { … secret_name … } }`.** Le nom du secret n'est
jamais dérivé du nom de la variable : la convention des secrets est kebab-case préfixé
(`tet-preprod-…`, comme `tet-preprod-coolify-host-ssh-key`), celle des variables est
`SCREAMING_SNAKE`, et le jeu de caractères admis pour les *noms* Scaleway n'est pas documenté
(seuls les `path` le sont). Le mapping rend aussi possible que deux clés visent le même secret.

**Règle de scope.** Une clé va au **scope projet** si et seulement si (a) ≥ 2 ressources
runtime la consomment avec la même valeur **et** (b) c'est un secret. Un littéral partagé est
dupliqué au scope ressource et dédupliqué en amont par un `local` HCL : passer par
`{{project.X}}` pour un littéral n'ajoute aucune déduplication mais ajoute un mode de panne,
sur des clés dont trois font planter le conteneur au boot.

## Inventaire — trois corrections à l'état des lieux

**`apps/backend` : 44 clés, pas 33.** La source de vérité est
`apps/backend/src/utils/config/configuration.model.ts`, pas `.env`. Absentes de l'inventaire
initial : `POSTHOG_HOST`, `POSTHOG_KEY`, `GOOGLE_API_KEY`, `GEMINI_MODEL`, `SMTP_URL`,
`SMTP_KEY`, `SMTP_FROM`, `SMTP_TO_EMAIL_WHITELIST`, `PRO_CONNECT_POST_LOGOUT_REDIRECT_URI`,
`MON_COMPTE_ADEME_POST_LOGOUT_REDIRECT_URI`, `PUBLIC_API_THROTTLE_LIMIT`,
`PUBLIC_API_THROTTLE_TTL`, `DELAY_IN_MIN_BEFORE_NOTIFY_PILOTE`,
`DEMARCHE_PCAET_BYPASS_DIAGNOSTIC`. **`DIRECTUS_API_KEY` n'existe plus** dans les sources — ne
pas la créer. Les clés à `prefault(...)` restent hors manifeste : on ne gère que ce dont on
dévie.

**Trois clés viennent de l'image et Coolify ne doit pas les porter.** `apps/app/Dockerfile`,
stage runner, pose `GIT_SHORT_HASH`, `GIT_COMMIT_TIMESTAMP`, `APPLICATION_VERSION` en `ENV`.
Elles sont dans `PUBLIC_ENV_KEYS` et remontent donc dans `window.__TET_PUBLIC_ENV__`, mais
décrivent **l'artefact**, pas l'environnement. Une variable Coolify écrase le `ENV` de
l'image : `/api/version` afficherait éternellement le SHA du jour où le manifeste a été écrit,
et le `HEALTHCHECK` qui tape `/api/version` mentirait. Même chose pour `GIT_COMMIT_SHORT_SHA`
(backend), `NODE_ENV`, `PORT`, `HOSTNAME`, `LANG`. Pire encore : `DEPLOYMENT_TIMESTAMP`
(`packages/api/src/environmentVariables.ts:53`) change à chaque déploiement — le gérer
produirait soit une valeur figée, soit un diff perpétuel.

**Lectures runtime non inventoriées côté `app`** : `ALLOWED_ORIGIN_PATTERN` (`cors.config.ts`),
`COOKIE_DOMAIN` (`packages/api/src/utils/supabase/cookie-options.ts:9`). `SITE_URL` et
`LOG_ACTION_DURATION` sont dans `PUBLIC_ENV_KEYS` mais absents du déploiement Koyeb actuel.
Attention : `LOG_ACTION_DURATION` est comparé à la chaîne `'TRUE'` **en majuscules**
(`environmentVariables.ts:16`) — `"true"` serait silencieusement inopérant.

## Architecture

```
Secret Manager                            Coolify — scope PROJET (secrets ≥2 consommateurs)
  /coolify-env/shared/                      SUPABASE_ANON_KEY
    tet-preprod-supabase-anon-key      ─┐   SUPABASE_JWT_SECRET
    tet-preprod-supabase-jwt-secret     ├─> SUPABASE_SERVICE_ROLE_KEY
    tet-preprod-supabase-service-…      │   POSTHOG_KEY
    tet-preprod-posthog-key            ─┘        │
                                                 │ {{project.X}}
  /coolify-env/app/          ─┐                  ├─ app          (application)
  /coolify-env/backend/       ├─ script ────>    ├─ backend      (application)
  /coolify-env/supabase-api/ ─┘                  └─ supabase-api (service|application)

Littéraux partagés (SUPABASE_URL, APP_URL, BACKEND_URL, POSTHOG_HOST, SENTRY_DSN, ENV_NAME)
→ dupliqués au scope ressource, dédupliqués par un `local` HCL, jamais par {{project.X}}.
```

Le script porte **toutes** les écritures (littéraux, références, secrets), pour un seul modèle
mental et un seul chemin de réconciliation. La ressource `coolify_application_envs` du provider
n'est pas utilisée : elle n'est pas autoritative (vérifié dans
`internal/service/application_envs_resource.go` — `filterRelevantEnvs()` n'itère que sur les
clés du state), donc les deux peuvent coexister, mais une clé déclarée des deux côtés
provoquerait une bataille à chaque apply.

## Fichiers

```
infra/preprod/
  coolify-env-secrets.tf              nouveau — 3 valeurs dérivées de l'infra
infra/coolify-preprod/
  env-manifest.tf                     nouveau — LE manifeste (locals)
  env-secrets.tf                      nouveau — coquilles scaleway_secret (owner="manual")
  env-push.tf                         nouveau — normalisation, préconditions, push, redéploiement
  variables.tf / outputs.tf / terraform.tfvars.example    modifiés
infra/scripts/
  coolify-push-env.sh                 nouveau — générique, piloté par le manifeste
  coolify-redeploy.sh                 nouveau — POST /deploy?force=true + attente
scripts/
  check-env-manifest.mts              nouveau — contrôle manifeste ↔ code (CI)
```

### `infra/preprod/coolify-env-secrets.tf`

Trois secrets seulement — ceux dont Terraform connaît déjà la valeur (elle est déjà dans le
state A via `random_password`, donc aucune régression de posture) :

| Secret | `path` | Source |
|---|---|---|
| `tet-preprod-supabase-database-url` | `/coolify-env/backend` | `module.postgres.private_connection_uri` |
| `tet-preprod-queue-redis-host` | `/coolify-env/backend` | `module.redis.private_ip` |
| `tet-preprod-gotrue-db-url` | `/coolify-env/supabase-api` | composé (`supabase_auth_admin` + IP privée) |

Pattern cloné de `infra/modules/coolify/main.tf:36-46` — valeur passée **en clair**, le
provider encode en base64 ; à la lecture, `base64decode`.

```hcl
resource "scaleway_secret" "coolify_env" {
  for_each    = local.coolify_env_secrets
  name        = each.key
  path        = each.value.path
  description = each.value.description
  tags        = ["tet", "env:preprod", "managed-by:terraform", "coolify-env"]

  # Un secret supprimé est irrécupérable. Double ceinture : prevent_destroy
  # bloque Terraform, protected fait refuser la suppression par l'API Scaleway
  # elle-même (y compris hors Terraform).
  protected = true
  lifecycle { prevent_destroy = true }
}

resource "scaleway_secret_version" "coolify_env" {
  for_each  = local.coolify_env_secrets
  secret_id = scaleway_secret.coolify_env[each.key].id
  data      = each.value.value
}
```

Prérequis : bumper le lock du provider Scaleway de `infra/preprod` (2.76 → 2.79, déjà la
version lockée côté `coolify-preprod`) pour disposer de `protected`.

### `infra/coolify-preprod/env-manifest.tf`

Grammaire d'une entrée, identique dans tous les scopes :

```hcl
<NOM_DE_LA_VARIABLE> = {
  source      = "literal" | "secret" | "shared"    # requis
  value       = string    # si literal — valeur EN CLAIR
  secret_name = string    # si secret — NOM du secret Scaleway (mapping explicite)
  secret_path = string    # si secret — path SM
  owner       = "preprod" | "manual"   # qui écrit la version dans SM
  shared_key  = string    # si shared — clé canonique du scope projet
  multiline   = bool      # défaut false
  comment     = string    # visible dans l'UI ; préfixe "[terraform]" = marqueur de propriété
}
```

Locals partagés — la source de vérité des littéraux communs :

```hcl
locals {
  env_name         = "preprod"
  app_url          = "https://app.preprod.territoiresentransitions.fr"
  site_url         = "https://preprod.territoiresentransitions.fr"
  backend_url      = "https://api.preprod.territoiresentransitions.fr"
  supabase_api_url = "https://supabase-api.preprod.territoiresentransitions.fr"
  posthog_host     = "https://p.territoiresentransitions.fr"

  # Fournies par l'image ou le déploiement : Coolify ne doit jamais les porter.
  env_image_provided_keys = [
    "GIT_SHORT_HASH", "GIT_COMMIT_TIMESTAMP", "APPLICATION_VERSION",
    "GIT_COMMIT_SHORT_SHA", "DEPLOYMENT_TIMESTAMP",
    "NODE_ENV", "PORT", "HOSTNAME", "LANG",
  ]
}
```

Scope projet — 4 clés, toutes secrètes :

| Clé | app | backend | supabase-api |
|---|---|---|---|
| `SUPABASE_ANON_KEY` | ✓ | ✓ | ✓ (→ `ANON_KEY`) |
| `SUPABASE_JWT_SECRET` | — | ✓ | ✓ (→ `GOTRUE_JWT_SECRET`, `AUTH_JWT_SECRET`, `PGRST_JWT_SECRET`) |
| `SUPABASE_SERVICE_ROLE_KEY` | — | ✓ | ✓ (→ `SERVICE_KEY`) |
| `POSTHOG_KEY` | ✓ | ✓ | — |

`SUPABASE_ANON_KEY` est publique par conception (sérialisée dans le HTML par
`PublicEnvScript`). On la garde en SM parce qu'elle est un JWT signé par
`SUPABASE_JWT_SECRET` : les deux tournent ensemble. Ne pas s'étonner de la voir en clair dans
la source de la page, et surtout ne pas activer `is_shown_once`.

Cas « même valeur, nom différent » :

| Valeur | Canonique | app | backend | supabase-api | Mécanisme |
|---|---|---|---|---|---|
| URL API Supabase | `local.supabase_api_url` | `SUPABASE_URL` | `SUPABASE_URL` | `API_EXTERNAL_URL` | littéral, dédup HCL |
| URL de l'app | `local.app_url` | `APP_URL` | `APP_URL` | `GOTRUE_SITE_URL` | littéral, dédup HCL |
| Clé anon | `SUPABASE_ANON_KEY` | `{{project.…}}` | idem | idem | shared var |

`BACKEND_URL` reste au scope `app` : il apparaît dans `GOTRUE_URI_ALLOW_LIST` mais
**concaténé** — ce n'est pas la même valeur. La composition se fait en HCL
(`"${local.app_url},${local.app_url}/**,${local.backend_url}/**"`), ce qui garantit quand même
la cohérence.

### Préconditions (`env-push.tf`)

Portées par chaque `terraform_data` de push. Les deux dernières sont les garde-fous
structurants :

```hcl
precondition {
  # Ces clés viennent du ENV de l'image : les poser dans Coolify les écraserait.
  condition     = length(setintersection(keys(local.env_app), toset(local.env_image_provided_keys))) == 0
  error_message = "env_app : clés fournies par l'image Docker ou le déploiement. Les retirer."
}
precondition {
  # Le fallback NEXT_PUBLIC_* existe pour la compatibilité. En poser
  # réintroduirait le couplage image↔environnement que f136ede51 supprime.
  condition     = alltrue([for k, e in local.env_app : !startswith(k, "NEXT_PUBLIC_")])
  error_message = "env_app : pas de NEXT_PUBLIC_* — la config runtime se lit sans préfixe."
}
precondition {
  # Anti-fuite. SUPABASE_ANON_KEY et SENTRY_DSN sont publiques par conception et
  # échappent volontairement au motif.
  condition = alltrue([
    for k, e in local.env_app :
    e.source != "literal" || !can(regex("(SECRET|PASSWORD|TOKEN|CREDENTIAL)", k))
  ])
  error_message = "env_app : valeur en clair interdite sur une clé au nom sensible."
}
```

Plus les préconditions de grammaire (`source` dans l'énumération, `value` si literal,
`secret_name`+`secret_path` si secret, `shared_key` existant dans `local.env_project`).

### `infra/scripts/coolify-push-env.sh`

Un seul script, agnostique du scope — évite quatre variantes quasi identiques et rend gratuit
le support « service vs application » pour supabase-api.

| Variable | Rôle |
|---|---|
| `COOLIFY_ENDPOINT`, `COOLIFY_TOKEN` | hérités de `coolify-env.sh` |
| `COOLIFY_ENV_SCOPE_PATH` | ex. `/projects/<uuid>/envs` |
| `COOLIFY_ENV_SCOPE_FLAVOR` | `shared` \| `resource` (champs permis + grammaire PATCH/DELETE) |
| `COOLIFY_ENV_MANIFEST` | JSON, **aucune valeur secrète** |
| `COOLIFY_ENV_PRUNE`, `COOLIFY_ENV_DRY_RUN` | optionnels, défaut `false` |

Passage du manifeste par `environment = {}` de `local-exec` : Terraform le met dans `cmd.Env`
du processus fils, la chaîne ne traverse **jamais** `/bin/sh -c` — zéro problème
d'échappement. Le plus gros scope (backend, ~38 entrées) pèse ~7 Ko contre un `ARG_MAX` de
256 Ko sur macOS. Le manifeste apparaît dans `terraform plan` : c'est voulu, c'est le diff
qu'on relit — et c'est pourquoi les préconditions anti-fuite ne sont pas cosmétiques.

**Algorithme en deux phases.** C'est le point clé : si un seul secret manque, on échoue avant
d'avoir modifié Coolify — pas d'état intermédiaire bancal, ce qui compte double maintenant
qu'une clé manquante fait crash-looper `apps/app`.

*Phase 1 — résolution, aucune écriture.* Garde-fous (refus si `set -x` actif, binaires,
variables requises) ; validation du manifeste par `jq` ; `GET` sur la ressource parente (404 →
« UUID introuvable, l'application a-t-elle été recréée dans l'UI ? ») ; résolution de chaque
valeur dans `$_tmpdir/values/<KEY>`, avec deux messages distincts pour « secret absent » et
« secret sans version ».

*Phase 2 — réconciliation.* `GET` de la collection → index `key → {id, value}` (les scopes
partagés renvoient un `id` entier, les ressources un `uuid` : `.uuid // .id` couvre les deux).
Puis par clé : absente → `POST` ; présente et identique → rien ; présente et différente →
`PATCH`. Un `409` sur `POST` (clé apparue entre le GET et le POST) déclenche un re-GET puis un
`PATCH`, un seul retry. Prune optionnel, limité aux clés dont le `comment` commence par
`[terraform]` — les clés posées à la main dans l'UI ne sont jamais touchées.

**Champs par flavor.** `ALLOWED_FIELDS` du contrôleur Coolify diffère ; un champ en trop
renvoie 422. Scope partagé : `key, value, is_literal, is_multiline, is_shown_once, comment` —
**pas** de `is_build_time` ni `is_preview`. Scope ressource : ces deux-là en plus, tous deux à
`false` (depuis `f136ede51` il n'y a plus aucune variable au build ; une variable marquée
build-time n'atteindrait jamais le conteneur).

`is_literal = true` par défaut, `false` pour `source = "shared"`. Raison : `is_literal`
empêche Coolify de réinterpréter `$` et `\` au rendu du `.env`, ce dont on a besoin (§ Pièges,
point 5). Mais on ne sait pas si `is_literal: true` neutralise aussi la substitution
`{{project.X}}` — réglage prudent pour les shared, l'étape 4 tranche.

`is_shown_once` figé à `false`, non exposé dans le manifeste : à `true`,
`removeSensitiveData()` masque la valeur au `GET`, le script croirait à un changement à chaque
run et déclencherait un redéploiement à chaque apply.

**Hygiène.** `set -euo pipefail` sans `set -x` (le script refuse de tourner en mode trace) ;
`umask 077` + `mktemp -d` + `trap` ; token et corps de requête passés à `curl` par fichier,
jamais en argv, pour ne pas apparaître dans `ps` (durcissement par rapport aux scripts
existants qui utilisent `-d "$_payload"`) ; logs qui ne citent que les clés
(`→ SUPABASE_DATABASE_URL  mise à jour`) ; sur erreur HTTP, `jq -r '.message'` et
`.errors | keys`, jamais `.errors | values`.

**Multiligne.** `$( )` supprime les newlines finales : sentinelle `printf 'x'` puis `${_out%x}`
pour préserver les octets exacts. Pour `GCLOUD_SERVICE_ACCOUNT_KEY`, stocker le JSON
**compacté** (`jq -c .`) avec `multiline = false` : un JSON sur une ligne évite tout
aller-retour newline à travers le `.env` généré par Coolify, et les SDK Google l'acceptent tel
quel.

### `scripts/check-env-manifest.mts`

Le manifeste va dériver — c'est déjà arrivé (44 clés dans le code contre 33 dans l'inventaire,
`DIRECTUS_API_KEY` fantôme). Ce contrôle est le seul mécanisme qui empêche la répétition.
Il compare `terraform output -json env_manifest_json` à :

- les clés **requises** de `backendConfigurationSchema` (scope `backend`) ;
- `PUBLIC_ENV_KEYS` moins la liste d'exclusion, plus les 3 serveur (scope `app`) ;
- les `${VAR}` extraits de `infra/preprod/supabase-api/docker-compose.yml`.

Règle : toute clé **requise** du code doit être au manifeste, toute clé du manifeste doit
exister dans le code. Les clés à `prefault` peuvent manquer. À brancher dans le futur
`.github/workflows/ci-infra.yml` déjà prévu au README.

### Redéploiement

Changer une variable ne redéploie pas, et pour `apps/app` la configuration n'est lue qu'au
boot puis sérialisée dans le HTML : sans redéploiement, rien ne change côté utilisateur.
`coolify-redeploy.sh` fait `POST /deploy?uuid=<uuid>&force=true` puis poll
`GET /deployments/{uuid}` jusqu'à état terminal, avec timeout ; un déploiement en échec fait
échouer l'apply. Piloté par `var.redeploy_after_env_push` (défaut `false`), déclenché sur
`triggers_replace = [terraform_data.push_env_app.id]` — l'`id` d'un `terraform_data` est
régénéré à chaque remplacement, donc le redéploiement ne part que si le push a rejoué.

## Étapes

### Étape 0 — Trancher le runtime du proxy (préalable)

`apps/app/content-security-policy.config.ts` construit `connect-src` / `script-src` depuis
`process.env.SUPABASE_URL`, `BACKEND_URL`, `POSTHOG_HOST`, et il est appelé depuis
`apps/app/proxy.ts` (Next 16.3.4, `middleware.ts` renommé). Si le proxy tournait sur le
runtime **edge**, Next remplacerait `process.env.X` par sa valeur de build : les trois seraient
vides malgré les variables Coolify, et le navigateur bloquerait silencieusement les appels
Supabase / backend / PostHog.

`proxy.ts` ne déclare pas de `runtime` et `next.config.ts` pas de `nodeMiddleware`. Un indice
fort pointe vers le runtime Node : le commentaire de `outputFileTracingIncludes` dit que
`@swc/helpers` est nécessaire « at runtime for the proxy » **au serveur standalone**. À
confirmer avant l'étape 5, sinon on cherchera le bug du mauvais côté :

```sh
curl -sI https://app.preprod.territoiresentransitions.fr/ | tr ';' '\n' | grep -i -A2 "content-security-policy"
# L'URL Supabase DOIT apparaître dans connect-src.
```

### Étape 1 — Bootstrap Secret Manager (manuel, une fois)

Deux prérequis d'accès : le profil `scw` local renvoie aujourd'hui
`insufficient permissions: list secret` — il faut au minimum `SecretManagerSecretAccess` pour
l'identité qui joue les scripts. Et valider le jeu de caractères des noms : créer un secret de
test confirme que la convention kebab-case retenue passe.

```sh
source infra/scripts/tf-env.sh
scw secret secret create name=tet-preprod-supabase-jwt-secret path=/coolify-env/shared protected=true
printf '%s' "$JWT" | scw secret version create \
  secret-name=tet-preprod-supabase-jwt-secret secret-path=/coolify-env/shared data=-
```

*Vérif* — aucune ligne à `versions=0` :
```sh
for p in /coolify-env/shared /coolify-env/app /coolify-env/backend /coolify-env/supabase-api; do
  echo "== $p"
  scw secret secret list path=$p --output=json | jq -r '.[] | "\(.name)\tversions=\(.version_count)"'
done
```

### Étape 2 — Stack A : valeurs dérivées

```sh
cd infra/preprod && terraform init -upgrade   # provider 2.76 → 2.79 (attribut `protected`)
terraform plan -out=tfplan                    # 6 à créer, 0 à détruire
terraform apply tfplan
```

*Vérif fonctionnelle* — traite le piège des caractères réservés (§ Pièges, point 5) avant
qu'il ne morde :
```sh
URI="$(scw secret version access-by-path secret-name=tet-preprod-gotrue-db-url \
  secret-path=/coolify-env/supabase-api revision=latest --output=json | jq -r '.data' | base64 --decode)"
ssh root@$COOLIFY_PUBLIC_IP "docker run --rm postgres:15 psql '$URI' -c 'select 1'"
# → 1. Un échec de parsing signale un caractère réservé dans le mot de passe.
```

### Étape 3 — Stack B : manifeste et coquilles, sans push

```sh
terraform fmt -recursive infra/
cd infra/coolify-preprod && terraform init && terraform validate && terraform plan
pnpm tsx scripts/check-env-manifest.mts
```

### Étape 4 — Scope projet, et verdict sur `{{project.X}}`

```sh
terraform apply          # push_env_project seul
terraform apply          # second apply : « No changes » → idempotence prouvée
```

**Le test décisif**, gratuit grâce à `validateRuntimeEnv()` : poser `SUPABASE_ANON_KEY` en
`shared` sur `apps/app`, déployer, lire les logs.

```sh
ssh root@$COOLIFY_PUBLIC_IP "docker logs --tail 40 \$(docker ps -qf label=coolify.applicationId=$APP_ID)"
# Cas A — le conteneur démarre : {{project.X}} est interpolé. On garde.
# Cas B — « Configuration runtime invalide … SUPABASE_ANON_KEY : String must contain
#          at least 1 character » : la référence n'est PAS résolue. Repli : passer les
#          4 clés en source="secret" dans chaque scope ressource. Une ligne par clé.
```

Variante plus parlante : mettre temporairement `SUPABASE_URL` en `shared` —
`z.string().url()` rejette la chaîne `{{project.SUPABASE_URL}}` sans ambiguïté.

### Étape 5 — Scope `apps/app`

```sh
terraform apply
```

*Vérif 1 — le conteneur démarre* : `docker ps --format '{{.Status}}'` → `Up … (healthy)`.

*Vérif 2 — la config atteint le navigateur* :
```sh
curl -fsS https://app.preprod.territoiresentransitions.fr/ | grep -o 'window.__TET_PUBLIC_ENV__=[^<]*' | head -c 600
```

*Vérif 3 — les métadonnées d'image ne sont pas écrasées* : `/api/version` doit renvoyer le SHA
du tag déployé, pas une valeur figée.

*Vérif 4 — la CSP* : `connect-src` contient les URL Supabase et backend.

*Vérif 5 — diff clés attendues / réelles*, sans afficher de valeur :
```sh
ssh root@$COOLIFY_PUBLIC_IP "docker exec \$(docker ps -qf label=coolify.applicationId=$APP_ID) printenv" \
  | cut -d= -f1 | sort > /tmp/actual.txt
terraform output -json env_manifest_json | jq -r '.app | fromjson | .[].key' | sort > /tmp/expected.txt
comm -23 /tmp/expected.txt /tmp/actual.txt   # doit être vide
```

### Étapes 6 et 7 — backend, puis supabase-api

Même schéma. Le backend valide aussi sa configuration au boot
(`backendConfigurationSchema`) : une clé requise manquante produit un message zod listant les
clés. Vérifs : `/health`, `/auth/v1/health`, `/storage/v1/status`.

### Étape 8 — Chaîne JWT de bout en bout

Le seul test qui valide vraiment le scope projet — les trois consommateurs doivent partager le
même `SUPABASE_JWT_SECRET` :

```sh
TOKEN=$(curl -fsS -X POST "…/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d '{"email":"…","password":"…"}' | jq -r .access_token)
curl -fsS -H "Authorization: Bearer $TOKEN" -H "apikey: $ANON_KEY" "…/storage/v1/bucket" | jq
# Un 401 = JWT secret désynchronisé entre gotrue et storage.
```

### Étape 9 — Redéploiement automatique, puis documentation

Modifier un littéral inoffensif (`LOG_ACTION_DURATION`), `terraform apply`, vérifier que le
plan montre `push_env_app` **et** `redeploy_app` à remplacer.

Documentation : section `### Variables d'environnement (Secret Manager → Coolify)` dans
`infra/README.md` — layout des `path`, les deux gestes de rotation, l'ajout d'une clé, la liste
d'exclusion, l'avertissement `terraform destroy`. *Vérif* : un collègue ajoute une clé
littérale en suivant le README seul.

## Pièges

1. **`apps/app` crash-loope si une clé manque.** Avant, l'inlining faisait planter le *build*,
   ce qui donnait un filet en CI. Maintenant le filet est au *boot du conteneur*. Une shared
   var non interpolée donne une chaîne vide → même crash. La phase 1 du script (résolution
   avant écriture) est la contre-mesure principale.

2. **Écraser les métadonnées d'image.** Symptôme discret et durable : `/api/version` figé, le
   healthcheck qui passe quand même, des traces Sentry attribuées au mauvais commit pendant
   des mois. Traité par précondition, pas par commentaire.

3. **Ordre d'apply entre stacks — non exprimable en Terraform.** States séparés, pas de
   `terraform_remote_state` par décision. Un apply de stack B prématuré échoue en phase 1,
   sans laisser Coolify à moitié configuré.

4. **Dérive du manifeste.** Déjà constatée. `scripts/check-env-manifest.mts` en CI est le seul
   mécanisme qui empêche la répétition ; sans lui, ce plan aura vieilli avant d'être appliqué.

5. **Caractères réservés dans les mots de passe — bug latent déjà présent.**
   `random_password.admin` de `infra/modules/postgres/main.tf:17` utilise
   `override_special = "!#$%&*()-_=+[]{}<>:?"`. Dans `postgres://user:PASSWORD@host/db` : `#`
   termine l'URI (fragment), `?` ouvre la query, `%` produit une séquence percent-escape
   invalide rejetée par `pg` (node) et `lib/pq`. `module.postgres.private_connection_uri` et
   `pg_connection_uri` sont donc des bombes à retardement, indépendamment de ce chantier. Deux
   issues : restreindre `override_special` à `-_.!*~` comme le fait déjà
   `random_password.supabase_auth_admin`, ou percent-encoder dans le `format()`. À trancher
   **à l'étape 2**, avant que la valeur ne parte dans Secret Manager.

6. **Rotation — deux gestes, trois chemins.** Valeur Terraform : apply sur stack A puis bump du
   compteur `*_revision` sur stack B. Valeur manuelle : `scw secret version create` puis bump.
   Filet : `terraform apply -replace=terraform_data.push_env_backend` converge toujours.
   Cas `SUPABASE_JWT_SECRET` : redéploiement **simultané** de backend et supabase-api — une
   fenêtre où gotrue signe avec la nouvelle clé et le backend vérifie avec l'ancienne
   déconnecte tout le monde. Cas `SUPABASE_ANON_KEY` : publiée dans le HTML, sa rotation n'est
   effective qu'après redéploiement **du frontend aussi**.

7. **Redéploiement dans les deux sens.** Sans redéploiement, rien ne change côté utilisateur.
   Avec, le service coupe quelques secondes (pas de rolling deploy par défaut). Acceptable en
   preprod, à revoir pour prod.

8. **`terraform destroy` détruirait des secrets irrécupérables.** Trois ceintures :
   `prevent_destroy`, `protected` (refus côté API Scaleway), et le retrait d'une clé du
   manifeste devenu un geste explicite en deux temps. `prevent_destroy` sur un `for_each`
   bloque aussi le retrait d'un seul élément — c'est le prix.

9. **Une clé appartient à exactement un mécanisme.** Si une clé est déclarée à la fois dans le
   manifeste et dans un `coolify_application_envs`, les deux se battront à chaque apply. À
   inscrire au README.

10. **UUID posés à la main.** Pas de ressource `coolify_application` dans `sierrajc/coolify`
    0.10.2 — seulement une data source. Trois UUID dans `terraform.tfvars` (gitignored). Une
    app recréée dans l'UI change d'UUID et le push part en 404 ; la phase 1 du script fait un
    GET sur la ressource parente pour produire le bon message.

11. **Un projet Coolify par environnement.** Sinon le scope projet fuiterait entre
    environnements. Cohérent avec un state par environnement. À défaut, basculer sur
    `/projects/{uuid}/environments/{env}/envs` — seul `local.env_scope_targets[*].path` change.

12. **`apps/site` reste sur le modèle build-time.** S'il est déployé sur Coolify avant
    migration, ses variables passeront par des « Build Variables » Coolify, pas par le
    manifeste. Le manifeste doit rester silencieux à son sujet.

13. **Le manifeste est public par construction** — plan, `terraform output`, logs CI. C'est ce
    qui permet la revue en PR, et ce qui rend les préconditions anti-fuite indispensables. Il
    faudra résister à « juste mettre ce petit token en literal pour débloquer ».

14. **`confirmation.html`** (`infra/preprod/supabase-api/templates/`) contient une URL en dur
    `http://localhost:3003/signup?...`. Sans rapport avec les env vars, mais bloquant pour un
    preprod fonctionnel — à corriger avant l'étape 7.

## Fichiers de référence

- `infra/coolify-preprod/main.tf` — pattern `terraform_data` + `local-exec` à répliquer
- `infra/scripts/coolify-configure-s3-storage.sh` — squelette de script (garde-fous, lecture
  `scw`, logs `→`/`✓`/`✗`), à durcir sur le passage des valeurs hors argv
- `apps/backend/src/utils/config/configuration.model.ts` — source de vérité des 44 clés backend
- `packages/api/src/public-env.ts` + `apps/app/src/utils/runtime-env/validate-runtime-env.ts` —
  la liste des clés et le test qui les vérifie
- `apps/app/Dockerfile` — les trois `ENV` du stage runner à ne jamais écraser
- `infra/modules/postgres/outputs.tf` — le `format()` de `private_connection_uri`, siège du
  piège des caractères réservés
