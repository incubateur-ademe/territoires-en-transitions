# API
Permet au projet territoire en transition de CRUD des données.

## Pour développer
Ce projet utilise pipenv comme package manager, [Scalingo prenant en charge pipenv](https://doc.scalingo.com/languages/python/start).

Il y a aussi un fichier d'installation poetry, une autre approche envisageable serait de faire un export de poetry vers un `requirement.txt` pris en charge par Scalingo. Ceci rajoutant une étape, le fichier poetry est considéré comme déprécié pour l'instant.

Installer les dépendances :
```shell
pipenv install
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

## Déploiement
```shell
pipenv run deploy
```
[Utilise git pour déployer](https://doc.scalingo.com/platform/deployment/deploy-with-git), il faut donc avoir saisi sa clé SSH au préalable chez Scalingo.

## Documentation OpenAPI
Elle est servie par fastAPI sur `/docs` pour les humains et `/openapi.json` pour les machines.



