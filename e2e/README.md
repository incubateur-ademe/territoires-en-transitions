# Test e2e avec Playwright

## Prérequis

- La stack tourne à côté : `make up` (apps en conteneurs) ou `make dev apps=app,backend` (apps sur l'hôte). Dans les deux cas les apps écoutent sur les ports de l'hôte (`network_mode: host`), les tests s'y connectent directement.
- `.env.keys` est présent à la racine (`make env-keys` sinon) : les secrets lus par les tests vivent chiffrés dans les `.env` du dépôt.
- Les navigateurs sont installés : `pnpm exec playwright install chromium`. Sur une distribution plus récente que celles publiées par Playwright, préfixer par `PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu24.04-x64`.

### Environnement

Aucune variable n'est à exporter à la main : [`playwright.config.mjs`](./playwright.config.mjs) déchiffre lui-même ce dont les tests ont besoin ([`load-local-env.mjs`](./load-local-env.mjs), via dotenvx). L'environnement est donc le même quel que soit le lanceur — terminal, mode `--ui`, ou extension Playwright de l'éditeur, qui lance `playwright` sans passer par le `Makefile`.

Les variables déjà définies dans l'environnement gagnent toujours, ce qui permet de pointer les tests ailleurs sans toucher au code :

| Variable                                  | Défaut local                               |
| ----------------------------------------- | ------------------------------------------ |
| `BASE_URL`                                | `http://localhost:$APP_PORT` (3000)        |
| `BASE_API_URL`                            | `http://localhost:$BACKEND_PORT` (8080)    |
| `SUPABASE_API_URL`                        | `SUPABASE_URL` du backend (kong, `:54321`) |
| `SUPABASE_MAILPIT_URL`                    | `http://127.0.0.1:54324`                   |
| `SUPABASE_DATABASE_URL`, `SUPABASE_*_KEY` | `apps/backend/.env` et `.env` (chiffrés)   |

Depuis un worktree, `APP_PORT` / `BACKEND_PORT` viennent du `.env.local` généré par `make worktree-env` : les tests visent les ports décalés du worktree, sans réglage supplémentaire.

En CI, ce chargement est court-circuité (`CI=true`) : le workflow injecte les variables lui-même.

## Jouer les tests existants

Pour exécuter les tests, il y a plusieurs méthodes possibles.

TLDR ? Une explication en vidéo [ici](https://www.youtube.com/watch?v=Xz6lhEzgI5I&list=PLQ6Buerc008dhme8fC80zmhohqpkA0aXI) (durée : 7 minutes)

⚠️ Comme le projet met un peu de temps à se lancer (avec les pages qui se construisent au fil des visites), il peut être nécessaire de lancer les tests plusieurs fois avant qu'ils réussissent.

Pour accélérer l'exécution des tests il est également possible de démarrer les versions de build des apps, comme on le fait en CI.

```sh
# build les apps
pnpm nx run-many -t build -p app auth backend
# démarre les versions de build
sh ./e2e/run-apps.sh
# jouer les tests...
```

### Méthode 1 : outil visuel (recommandée)

Playwright propose un outil très pratique pour jouer les tests et en visualiser les étapes.
Pour l'utiliser :

```sh
pnpm exec playwright test --config ./e2e/playwright.config.mjs --ui
```

Quelques fonctionnalités intéressantes :

- Before/after : permet de voir l'état du front avant et après une étape donnée du test
- Watch mode : écoute les modifications faites dans VS Code pour un test donné
- Pick locator (icône cible) : permet de récupérer le locator d'un élément d'ui en survolant cet élément

TLDR ? Une explication en vidéo [ici](https://www.youtube.com/watch?v=d0u6XhXknzU&list=PLQ6Buerc008dhme8fC80zmhohqpkA0aXI&index=4) (durée : 6 minutes)

### Méthode 2 : extension de l'éditeur

Au préalable, il faut installer l'extension Playwright (VS Code, Antigravity, Cursor…). Une fois que cela est fait, dans le fichier de test, des flèches permettant de jouer le test apparaissent.

Une fois le test joué, une fenêtre de navigateur s'ouvre et le test qui vient de s'exécuter se rejoue visuellement.

L'extension lance `playwright` directement, sans le `Makefile` : elle hérite de l'environnement de l'éditeur, pas de celui d'un shell de développement. C'est la config qui déchiffre les secrets (cf. [Environnement](#environnement)), il n'y a donc rien à recopier dans `playwright.env` des réglages de l'éditeur.

### Méthode 3 : dans le terminal

Pour exécuter les tests et voir le résultat dans le terminal, la commande est :

```sh
pnpm exec playwright test --config ./e2e/playwright.config.mjs
```

Dans ce cas, un simple output dans le terminal nous dit si les tests passent.

## Créer des tests

Playwright propose un outil de génération des tests.

Celui-ci permet de réaliser des actions dans le front de l'app et de générer les tests automatiquement.
Plus d'infos [ici](https://playwright.dev/docs/codegen-intro).

Pour lancer le générateur de tests :

```sh
npx playwright codegen
```

TLDR ? Une explication en vidéo [ici](https://www.youtube.com/watch?v=LM4yqrOzmFE&list=PLQ6Buerc008dhme8fC80zmhohqpkA0aXI&index=3) (durée : 7 minutes)

### Modale d'incitation MonCompteAdeme

Elle s'ouvre en overlay sur toutes les pages authentifiées quand le provider est activé — le cas en local, pas en CI — et intercepte alors les clics. [`main.fixture.ts`](./tests/main.fixture.ts) la neutralise donc par défaut. Une suite qui la teste la réclame explicitement :

```ts
test.use({ oidcModal: 'shown' });
```
