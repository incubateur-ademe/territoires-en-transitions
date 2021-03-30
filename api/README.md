# API
## Pour développer
```shell
pipenv install
```

### Servir en local 
```shell
pipenv shell
python ./api/dev_server.py
```

## Variables d'environnement
- `PORT` 8000 par défaut, c'est le port utilisé par le client sur localhost. En prod, Scalingo se charge de passer le bon port.
- `DATABASE_URL` sqlite://:memory: par défaut, `postgres://<user>:<password>@territoires-4734.postgresql.dbs.scalingo.com:34582/territoires_4734` en production, voir l'admin de Scalingo.

## Déploiement 
```shell
git push scalingo master
```
