# API pour territoiresentransitions.fr

Ce projet est lié au projet au projet [territoires-en-transitions](https://github.com/betagouv/territoires-en-transitions).
Il est la partie API du projet et permet la gestion des données des EPCIs
concernant la transition écologique.

- [Pré-requis](#pré-requis)
- [Pour développer](#pour-développer)
- [Migrations](#migrations)
  - [Préparer la base de données pour l'environnement de
    développement](#préparer-la-base-de-données-pour-l-environnement-de-développement)
  - [Créer une migration](#créer-une-migration)
  - [Lancer les migrations](#lancer-les-migrations)
- [Déploiement](#déploiement)

## Pré-requis

- Python >= 3.9.1
- [Pipenv](https://pypi.org/project/pipenv/)

## Pour développer
Ce projet utilise pipenv comme package manager, [Scalingo prenant en charge pipenv](https://doc.scalingo.com/languages/python/start).

Il y a aussi un fichier d'installation poetry, une autre approche envisageable serait de faire un export de poetry vers un `requirement.txt` pris en charge par Scalingo. Ceci rajoutant une étape, le fichier poetry est considéré comme déprécié pour l'instant.

Installer les dépendances :
```shell
pipenv install
pipenv install --dev
```

### Servir en local
Avec le reload du code :
```shell
pipenv run dev
```

Sans le reload :
```shell
pipenv run serve
```

### Tester
```shell
pipenv run test
```

### Exécuter des requêtes depuis IntelliJ
Le dossier `requests` comporte les fichiers pour utiliser l'API [depuis l'éditeur](https://www.jetbrains.com/help/idea/http-client-in-product-code-editor.html) comme une alternative à curl.

## Variables d'environnement
- `PORT` 8000 par défaut, c'est le port utilisé par le client sur localhost. En prod, Scalingo se charge de passer le bon port.
- `DATABASE_URL` sqlite://:memory: par défaut, `postgres://<user>:<password>@<projet>.postgresql.dbs.scalingo.com:34582/<projet>` en production, voir l'admin de Scalingo.


## Migrations
En production, notre API utilise l'outil [aerich](https://tortoise-orm.readthedocs.io/en/latest/migration.html)
pour gérer les migrations de base de données.

### Préparer la base de données pour l'environnement de développement
Aerich ne fonctionne pas avec SQLite qui est la connexion par défaut de
l'environnement de développement. Pour pouvoir lancer les migrations en local,
il faudra donc utiliser une connexion PostgreSQL. Pour cela :
- [Installer PostgreSQL](https://www.postgresql.org/download/),
- Démarrer le serveur PostgreSQL,
- Configurer le mot de passe de l'utilisateur `postgre` (par défaut, il n'en a
  pas),
- Créer une base de données pour le projet.

Après avoir ouvert une connexion PostgreSQL, on peut créer un fichier `.env`
avec la variable d'environnement `DATABASE_URL` :
```
# .env

DATABASE_URL='postgres://<username>:<password>@localhost:5432/<database>'
```

Puis, activer le shell de Pipenv:
```sh
pipenv shell
```

Cette commande [charge automatiquement les variables d'environnement](https://pipenv.pypa.io/en/latest/advanced/#automatic-loading-of-env) contenues dans le fichier `.env`.


### Créer une migration
```shell
pipenv shell
aerich migrate --name my_feature
```

### Lancer les migrations
Pour lancer les migrations jusqu'à la plus récente :
```shell
pipenv shell
aerich upgrade
```

## Déploiement

### Lancer les migrations en production
Si le déploiement contient une ou plusieurs migrations, il faut d'abord lancer
les migrations avant de déployer l'API. Le déploiement étant manuel pour
l'instant, on gère donc les migrations à partir d'une machine en local :
1. On configure la variable d'environnement `DATABASE_URL` soit directement dans
   le shell pipenv, soit via un fichier `.env`, avec l'url de la base de données
   de production.
2. On peut vérifier rapidement l'historique des migrations existantes :
  ```
  pipenv shell
  aerich history
  ```
3. On vérifie les migrations à effectuer :
  ```
  aerich heads
  ```
4. On lance les migrations :
  ```
  aerich upgrade
  ```

### Déployer l'API
On [utilise git pour déployer](https://doc.scalingo.com/platform/deployment/deploy-with-git), il faut donc avoir saisi sa clé SSH au préalable chez Scalingo.

Pour déployer sur [sandbox](https://sandboxterritoires.osc-fr1.scalingo.io/):
```shell
git remote add sandbox git@ssh.osc-fr1.scalingo.com:sandboxterritoires.git
git push sandbox sandbox:master
```

Pour déployer sur [staging](https://territoiresentransitions.osc-fr1.scalingo.io.):
```shell
git remote add staging git@ssh.osc-fr1.scalingo.com:territoiresentransitions.git
git push staging staging:master
```

## Documentation OpenAPI
Elle est servie par fastAPI sur `/docs` pour les humains et `/openapi.json` pour les machines.
