# API
## Serve locally
```shell
poetry run serve
```

## Variables d'environnement
- `PORT` 8080 par défaut
- `DATABASE_URL` sqlite://:memory: par défaut, `postgres://<user>:<password>@territoires-4734.postgresql.dbs.scalingo.com:34582/territoires_4734` en prod

## Déploiement 
```shell
poetry export -f requirements.txt > requirements.txt --without-hashes
git push scalingo master
```
