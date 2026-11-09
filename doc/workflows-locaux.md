# Workflows en local avec act

Le workflow [dev.yml](../.github/workflows/dev.yml) fournit les commandes locales
pour les services Supabase et Redis utilisés par la CI. Cette stack Supabase CLI
(`supabase_db_tet`) est distincte de la stack Docker Compose du développement
applicatif, gérée par le [Makefile](../Makefile) avec `make db-init`.

## Configuration

Installer [act](https://nektosact.com/) et démarrer Docker. Depuis la racine du
dépôt, créer les fichiers de configuration lors de la première utilisation :

```sh
cp .github/config/.act.vars.default .github/config/.act.vars
cp .github/config/.act.secrets.default .github/config/.act.secrets
```

Compléter les valeurs nécessaires au job choisi dans ces fichiers.
[.actrc](../.actrc) les charge automatiquement : `.act.vars` alimente le contexte
GitHub `vars`, `.act.secrets` le contexte `secrets`.

`act` définit `ACT`, utilisé dans les actions pour adapter les étapes locales.
La préparation de la base utilise les images locales sans télécharger ni publier
son image de volume dans GHCR. Ce guide concerne `dev.yml` ; les workflows de CI
et de déploiement s'exécutent sur GitHub Actions.

## Commandes

Lister les jobs :

```sh
act -W .github/workflows/dev.yml -l
```

Lancer un job en remplaçant `db-start` par le nom voulu :

```sh
act -W .github/workflows/dev.yml -j db-start
```

| Job              | Effet                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------- |
| `prepare-dev-db` | Créer l'image de la base de test si elle est absente ; remplace alors le volume local. |
| `db-start`       | Démarrer Supabase avec la base sauvegardée.                                            |
| `db-stop`        | Arrêter Supabase.                                                                      |
| `db-save`        | Sauvegarder le volume de la base dans une image locale.                                |
| `db-restore`     | Remplacer le volume de la base par la sauvegarde locale.                               |
| `db-delete`      | Arrêter Supabase et supprimer le volume et son image de sauvegarde.                    |
| `redis-start`    | Démarrer Redis.                                                                        |

## Accès à Docker

Si un job échoue avec "docker daemon is not running", vérifier d'abord que
`docker info` fonctionne sur la machine. Si le daemon est accessible mais que le
job échoue encore, vérifier le chemin de la socket Docker et renseigner
`--container-daemon-socket` dans `~/.actrc` avec le chemin propre à la machine.
