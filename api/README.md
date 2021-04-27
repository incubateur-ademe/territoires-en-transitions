# API
Permet au projet territoire en transition de CRUD des données.

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
Pour utiliser l'outil de migration [aerich](https://tortoise-orm.readthedocs.io/en/latest/migration.html) il faudra penser à utiliser une connexion postgres, aerich ne fonctionnant pas avec sqlite (la connexion par défaut).

Exemple pour créer un fichier de migration:
```shell
pipenv shell
$env:DATABASE_URL='postgres://postgres:pgroot@localhost:5432/fastapi'
aerich migrate --name my_feature
```

Pour migrer un environnement, il faut le faire depuis sa machine de dev, la migration ne faisant pas encore partie du déploiement.
```shell
pipenv shell
$env:DATABASE_URL='environnement_url'
aerich upgrade
```


## Déploiement
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



