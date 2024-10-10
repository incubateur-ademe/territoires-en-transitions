# Edge functions

Les fonctions *edge* sont des fonctions TS éxécutables avec le runtime Deno et déployables dans le cloud Supabase.

[Guide](https://supabase.com/docs/guides/functions)

## Développer en local (mode watch)

`supabase functions serve`

## Ajouter une fonction

`supabase functions new NomFonction`

## Lister les fonctions déployées

```sh
supabase functions list --project-ref <PROJECT_ID>
```

## Déployer une fonction

```sh
supabase functions deploy <FUNCTION_NAME> --project-ref <PROJECT_ID>
```

## Lister les variables d'environnement

```sh
supabase secrets list --project-ref <PROJECT_ID>
```

## Ajouter une variable d'environnement

```sh
supabase secrets set <NAME>=<VALUE> --project-ref <PROJECT_ID>
```
