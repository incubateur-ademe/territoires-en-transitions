# Territoires en Transition

Dans le cadre des programmes d'accompagnement des collectivités dans leurs démarches de transition écologique, l'[ADEME (l'Agence de la transition écologique)](https://www.ademe.fr/) s'est associée à [beta.gouv.fr](https://beta.gouv.fr/).

L'objectif : Aider les collectivités à prioriser la mise en œuvre des actions les plus impactantes pour réussir la transition écologique.

## Description du service

### Une transition écologique lente et complexe

Les collectivités ont un rôle central à jouer dans la transition écologique. Elles possèdent les compétences et l'influence sur de nombreuses activités déterminantes pour la réussite de la transition écologique.

Une majorité des collectivités rencontrent des difficultés à mettre en place des actions à la hauteur des enjeux sur leur territoire. Au-delà des différents blocages politiques, organisationnels et financiers, ces difficultés sont directement liées à la complexité et transversalité des sujets de la transition écologique qui, pourtant, dans leur mise en oeuvre, ne sont portés que par quelques personnes au sein de la collectivité.

### Faciliter et accélérer la mise en oeuvre des actions de transition écologique

La plateforme numérique a pour objectifs de faciliter et d'accélérer la mise en oeuvre des actions ayant le plus d'impact pour la réussite de la transition écologique au sein d'une interface permettant :

- D'accéder aux référentiels d'actions de transition écologique CAE (Climat-Air-Énergie, aussi connu comme la labellisation Cit'ergie) et ECI (Économie Circulaire) et de personnaliser leur utilisation
- De gérer et suivre ses actions et indicateurs de transition écologique
- De prioriser les actions ayant le plus d'impact
- De partager la progression des réalisations et des retours d'expériences entre collectivités

## Documentation

La documentation technique du projet utilise le format Architecture Decision Record (ADR), basé sur le template par défaut du CLI [`adr-tools`](https://github.com/npryce/adr-tools).

## Organisation du dépôt

Ce dépôt Git contient :

- 3 services :
  - le ["data-layer"](./data_layer)
  - le [client](./apps/app)
- le [code du site statique](./apps/site)
- les [composants partagés](./packages/ui) entre le client et le site

Chaque dossier à la racine contient son propre `README.md` et peut a priori fonctionner de manière autonome.

Vous pouvez contribuer à notre projet [en suivant cette documentation](docs/workflows/contribuer-au-projet.md).

# Conception

La conception, des données au choix de la stack.

## Données

### Les données métier

Les données métier suivantes sont stockées sur des spreadsheets partagés:

- La définition des indicateurs
- Les questions de personnalisation
- La définition des référentiels (actions, preuves)

Cela permet de bénéficier des avantages suivants par rapport aux markdown employés jusqu'alors:

- Edition facilitée sans connaissance de la syntaxe markdown (y compris en utilisant des tris / filtres du tableau) par des personnes métier sans impacter les équipes de développement.
- Gestion de l'historique facilement accessible.
- Contrôle de validité des données saisies simplifié:
  - Validation directement dans le spreadsheet lorsque cela est faisable à travers des listes déroulantes par exemple.
  - Fonctionnalité de validitation du contenu faisant appel au backend intégrée sous forme de bouton.

## Stack

- Le `client` utilise React ce qui nous permet de bénéficier d'un écosystème riche. Il est développé en TypeScript.

- Le `data layer` utilise [Supabase](https://github.com/supabase/), une solution qui intègre tous
  les [services](https://supabase.com/docs/architecture) dont nous avons besoin en open source dont :

  - [gotrue](https://github.com/netlify/gotrue) pour l'authentification OAuth2
  - [PostgreSQL](https://www.postgresql.org/) la base qui nous apporte le typage et la consistence des données.
  - [PostgREST](https://postgrest.org/en/stable/) qui transforme la base de donnée en une API RESTful.

- le `business` est développé en Python 🐍.

## Lancer le projet en local pour le développement

### Dépendances

- Docker, permet de lancer les conteneurs qui composent le produit (stack Supabase, Redis…). Installation simple avec [Docker Desktop](https://docs.docker.com/desktop/).
- `make`, point d'entrée de toutes les commandes du projet (`make help` pour la liste).
- Node.js 24 et [pnpm](https://pnpm.io/) pour lancer les apps sur la machine hôte.

Pour la première installation, une fois `.env.keys` en place (voir « Variables d'environnement »), lancez :

```sh
make install    # dépendances node
make db-init    # services docker + migrations + référentiels + données de test
```

### Deux modes de développement

- 🐋 **Mode tout Docker** : `make up` lance chaque app cochée **dans son conteneur**, code monté et HMR actif — seuls docker et `.env.keys` sont requis. L'intelligence nx est préservée : un **daemon nx partagé** entre conteneurs (service `nx-daemon`), un pré-build des libs communes (service `libs`, un seul graphe de tâches, cache partagé), et un conteneur par app (logs, restart et healthcheck individuels : `docker compose restart backend` sans toucher au reste). Le premier lancement peut être un peu long (build des images, installation des dépendances dans un volume dédié, compilation de canvas) ; les suivants durent quelques secondes. Pour suivre les logs : `make tui` (tableau de bord interactif : statuts, URLs locales, logs navigables par service) ou `make logs s=<service>`.
- 🧑‍💻 **Mode hybride** (par défaut) : les services tournent en docker mais les apps tournent sur la machine hôte (`make dev`) — Node 24 local requis, TUI nx.

> 🍏 Sur mac, le mode Docker nécessite Docker Desktop ≥ 4.34 avec *host networking* activé ; à défaut, utilisez le mode host. Si le HMR ne réagit pas (montages VirtioFS), exportez `WATCHPACK_POLLING=true` via `Makefile.local`.

> 🐧 **Linux** : les limites inotify du noyau sont partagées entre l'hôte (IDE, nx…) et les conteneurs. Avec les valeurs par défaut (`max_user_instances=128`, `max_user_watches=65536`), Turbopack plante au démarrage des apps (`OS file watch limit reached` → `Next.js app exited with code 1`) : le conteneur sort avant d'être *healthy* et `make up` replie alors toute la stack (échec obscur). `make up` refuse de démarrer les apps sous ces limites et affiche la marche à suivre ; pour les relever et les persister une fois pour toutes :
>
> ```sh
> make inotify-persist
> ```

### Package manager

**⚠️ Ce projet utilise exclusivement [`pnpm`](https://pnpm.io/).**

- **Espace disque optimisé**: stockage partagé des dépendances entre projets
- **Sécurité**: résolution stricte des dépendances et `node_modules` non-plat
- **Performance**: installation plus rapide et meilleure prise en charge des monorepos

L'installation passe par le registre npm privé Bryntum. Le token (`BRYNTUM_ACCESS_TOKEN`) est chiffré dans le `.env` racine et le `.npmrc` du projet le référence par variable d'environnement : avec `.env.keys` en place (voir « Variables d'environnement »), il suffit de lancer :

```sh
make install
```

La target injecte le token à la volée puis recompile les modules natifs (`canvas`, `supabase`) que le `ignore-scripts` du `.npmrc` empêche de builder à l'installation. À noter : la compilation de [node-canvas](https://github.com/Automattic/node-canvas) (pas de binaire précompilé pour Node 24) nécessite les bibliothèques système Cairo/Pango :

```sh
# 🐧 Linux (Debian/Ubuntu)
sudo apt-get install -y --no-install-recommends \
  build-essential pkg-config libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# 🍏 macOS
brew install pkg-config cairo pango libpng jpeg giflib librsvg
```

### Variables d'environnement

Les fichiers `.env` du projet (racine **et** apps) sont **versionnés** et gérés avec [dotenvx](https://dotenvx.com) via les commandes `make` (voir `make help`) :

- les secrets sont **chiffrés** dans les fichiers (valeurs préfixées par `encrypted:`) ; la config locale non confidentielle (ports, URLs localhost, variables `NEXT_PUBLIC_*` exposées au navigateur) peuvent rester en clair ;
- **une seule paire de clés pour tout le monorepo** : la clé publique (`DOTENV_PUBLIC_KEY`) est en tête de chaque fichier, la clé privée est dans `.env.keys` (**non versionné**, à récupérer auprès de l'équipe et à placer à la racine).

Les fichiers ne se déchiffrent jamais à la main : `make dev` injecte les valeurs déchiffrées à la volée (via `dotenvx run`) avant de lancer nx. Les apps lisent leurs `.env` sans savoir les déchiffrer, mais n'écrasent jamais une variable déjà présente dans l'environnement — aucune modification du code des apps n'est nécessaire.

```sh
make dev                        # les apps cochées, infra démarrée, env déchiffré
make dev apps=app,auth,backend  # fixe la sélection sans prompt

make env-set e=SMTP_KEY=<valeur> app=backend       # définir un secret (chiffré) sans toucher au fichier
make env-set k=SMTP_KEY v=<valeur> app=backend     # idem, forme longue k=/v=
make env-get k=SMTP_KEY app=backend                # lire la valeur déchiffrée d'une clé
```

Le script [`make_dot_env.sh`](./make_dot_env.sh) (génération des `.env` depuis les `.env.sample`) n'est plus nécessaire en local — il reste utilisé par la CI.

### Stack locale

La stack locale est décrite dans [`docker-compose.yml`](./docker-compose.yml) et pilotée par le Makefile : stack Supabase répliquée, Redis, le CMS Strapi, et les apps conteneurisées. Chaque composant porte un profil compose, sélectionnable via le prompt de `make up`.

| Composant | URL |
| --- | --- |
| API Supabase (Kong) | <http://localhost:54321> |
| Postgres | `localhost:54322` |
| Supabase Studio | <http://localhost:54323> |
| Mailpit (emails de test) | <http://localhost:54324> |
| Redis | `localhost:6379` |
| Strapi (CMS du site) | <http://localhost:1337> |
| app / site / panier / auth | <http://localhost:3000> / 3001 / 3002 / 3003 |
| backend (API) | <http://localhost:8080> |

```shell
make db-init            # première installation : services + migrations + référentiels + données de test
make up                 # sélecteur des conteneurs à lancer (services + apps, mémorisé)
make down               # stoppe tout (les données sont conservées entre les sessions)
make logs s=backend
make tui                # tableau de bord interactif : statuts, URLs, logs navigables, start/stop/restart
make db-shell           # psql dans la base locale
```

`make db-init` enchaîne : démarrage des services, migrations [sqitch](./data_layer/sqitch), import des définitions (indicateurs, questions de personnalisation, référentiels) via les tests backend — qui lisent les CSV du dépôt mais démarrent le backend complet, d'où le besoin de `.env.keys` — puis chargement des données de test ([`data_layer/seed`](./data_layer/seed)). La commande est idempotente : migrations et seeds déjà appliqués sont sautés. À noter : elle exécute les tests backend **sur l'hôte** (`make install` requis au préalable).

En mode Docker, les dépendances vivent dans le volume `node-modules`, réinstallées incrémentalement par le service `deps` à chaque `make up` — après un changement de `pnpm-lock.yaml`, un simple `make up` suffit donc.

#### Git worktrees & agents

Un [git worktree](https://git-scm.com/docs/git-worktree) (branche parallèle, agent IA…) peut développer **en même temps** que le checkout principal : il partage l'infra docker (Supabase, Redis, Strapi — et donc la base) mais ses apps écoutent sur des **ports décalés**. Création de A à Z :

```sh
make worktree      # type (conventional branch) + nom du sujet demandés interactivement
make worktree t=feature n=great-feature   # sans prompt (agents, scripts)
```

La commande crée la branche `<type>/<nom>` ([conventional branch](https://conventionalbranch.org/)), le dossier frère `../tet-<nom>`, copie `.env.keys`, attribue le slot de ports et propose de **lancer directement** : côté hôte (`make dev`, dépendances installées en silence) ou côté docker (`make up`, rien à installer sur l'hôte). Sinon, dans le worktree :

```sh
make dev apps=app,auth,backend   # mode host : app :3200, auth :3203, backend :8280 (slot 2 → +200)
make up            # mode Docker : mêmes apps en conteneurs, projet compose dédié tet-wt2
```

En fin de sujet : `make down` dans le worktree puis `git worktree remove` — et si une stack a été oubliée (worktree supprimé sans `down`), `make worktree-prune` nettoie les projets `tet-wt*` orphelins, volumes compris.

Au premier `make dev`/`make install`/`make up`, [`scripts/worktree-env.mts`](./scripts/worktree-env.mts) attribue un slot stable (persisté dans `.env.local`, collisions détectées entre worktrees) et génère les `.env.local` : ports `*_PORT` décalés de `slot × 100` et URLs inter-apps recalculées — les valeurs committées des `.env` ne bougent pas, et Supabase/redis/strapi restent sur leurs ports standard. En mode Docker, le worktree pilote son **propre projet compose** `tet-wt<slot>` ([`docker-compose.worktree.yml`](./docker-compose.worktree.yml)) : apps seules (l'infra requise est démarrée dans la stack du checkout principal), dépendances installées dans son volume `node-modules` (premier `make up` plus long ; store pnpm et cache nx partagés), `make down`/`stop`/`logs`/`ps`/`tui` y agissent sur cette stack-là uniquement. Comme la base est **partagée**, `make db-migrate`/`make db-seed` restent possibles depuis un worktree (avec avertissement) : c'est le geste normal pour développer une migration sur sa branche. Seuls `db-init`/`db-reset`/`cms-pull` sont réservés au checkout principal.

#### Comptes de test

Les données de test créent des utilisateurs Supabase prêts à l'emploi, tous avec le mot de passe **`yolododo`** : `yolo@dodo.com` (admin de la collectivité Ambérieu-en-Bugey), `yala@dada.com`, `yili@didi.com`, `youlou@doudou.com` et `yulu@dudu.com` (voir [`data_layer/seed/fakes/11-insert_fake_user.sql`](./data_layer/seed/fakes/11-insert_fake_user.sql)). On peut aussi créer un compte réel via <http://localhost:3003> — l'email de confirmation arrive dans Mailpit (<http://localhost:54324>).

Strapi démarre avec une base Postgres dédiée et vide : le premier compte administrateur se crée au premier accès à <http://localhost:1337/admin>. Pour récupérer le contenu réel de l'instance distante :

```shell
make cms-pull   # ⚠ remplace tout le contenu Strapi local
```

Prérequis : `STRAPI_REMOTE_URL` et `STRAPI_TRANSFER_TOKEN` dans le `.env` racine (via `make env-set`). Le token doit être un **transfer token** (Settings → Transfer tokens sur le remote, permission *pull*) — un API token classique ne fonctionne pas.

Les edge functions Deno ([`supabase/functions/`](./supabase/functions/)) sont un composant cochable de `make up`, décoché par défaut : elles ne servent en local que pour tester le formulaire de contact du site (`site_send_message`). Tant qu'elles ne tournent pas, kong répond simplement 503 sur `/functions/v1/`.

### Réinitialiser complètement la base

Pour regénérer l'état initial de la base (après des tests manuels, ou en changeant de branche si `data_layer` a évolué) :

```shell
make db-reset
```

Celle-ci supprime le volume docker de la base puis relance `make db-init`.

> ℹ️ L'ancien workflow basé sur [act](https://nektosact.com/) (`act -j db-init`…) reste documenté dans le [README de la CI](./.github/README.md) — la CI continue de fonctionner ainsi.

### Lancer les tests

Les trois services sont des projets indépendants qui peuvent-être testés en local sous reserve que les dépendances de
développement soient installées.

Néanmoins, on peut lancer les tests avec `earthly` en utilisant des conteneurs :

```shell
# Lance le projet suivi de tout les tests.
earthly +dev

# Lance les tests indépendamment
earthly --push +db-test
earthly --push +app-test
earthly --push +api-test
earthly --push +deploy-test
```

## Déploiement

Les services sont déployés chez [Koyeb](https://koyeb.com/) dans la zone PAR (Paris), le `data layer` est chez [Supabase](https://supabase.com/) en mode BaaS et est hébergé en Europe.

Se référer au README des différents dossiers pour plus de détails.

Pour nos apps :

- `app` dans `./apps/app`
- `backend` dans `./apps/backend`
- `panier` dans `./apps/panier`
- `site` dans `./apps/site`

Pour nos libs :

- `ui` dans `./packages/ui`
- `api` dans `./packages/api`
