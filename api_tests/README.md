# API tests

Regroupe les tests d'intégration de l'API générée par le Datalayer.

Ces tests écrits en TypeScript nous permettent de produire des scénarios d'utilisation au fur et à mesure du développement de l'API et de s'assurer que l'API est bien accessible par le client.

On se sert des [tests pgTAP](../data_layer/tests) pour tester le comportement de la base de données.

## Utilisation

[Installer deno](https://deno.land/manual/getting_started/installation), puis
lancer les tests avec :

```sh
deno test --allow-net --allow-env --allow-read tests/ --location 'http://localhost'
```

La commande se décompose ainsi :

- `deno test`: le [test runner de deno](https://deno.land/manual/testing)
- `--allow-net`: permet l'accès au network
- `--allow-env`: permet de lire les variables d'environnement
- `--allow-read`: permet de lire les variables d'environnement du ficher `.env`
- `tests/`: tous les fichiers TypeScript `.test.ts` du dossier `tests`
- `--location`: le `location.href` dont le client Supabase a besoin

### Variables d'environnement

- `SUPABASE_URL`: l'URL de Supabase
- `SUPABASE_KEY`: la clé **anon** de l'API

## Générer les types

Nécessite [d'installer la CLI Supabase](https://supabase.com/docs/guides/cli).

```sh
gen_types.sh
```

### Variables d'environnement

- `POSTGRES_PASSWORD`: Le mot de passe de la base locale, voir le `.env` à la
  racine.
- `POSTGRES_PORT`: Le port de la base locale

## Formater la doc et le code

Pour le moment on le fait avant commit en attendant de mettre à jour notre CI.

```sh
deno fmt
```
