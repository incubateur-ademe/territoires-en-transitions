# API tests

Regroupe les tests d'intégration de l'API fournie par le Datalayer.

## Utilisation

[Installer deno](https://deno.land/manual/getting_started/installation), puis
lancer les tests avec :

```sh
deno test --allow-net --allow-env tests/ --location 'http://localhost'
```

La commande se décompose ainsi :

- `deno test`: le [test runner de deno](https://deno.land/manual/testing)
- `--allow-net`: permet l'accès au network
- `--allow-env`: permet de lire les variables d'environnement
- `tests/`: tous les fichiers TypeScript `.test.ts` du dossier `tests`
- `--location`: le `location.href` dont le client Supabase a besoin

### Variables d'environnement
- `SUPABASE_URL`: l'URL de Supabase
- `SUPABASE_KEY`: la clé **anon** de l'API 
