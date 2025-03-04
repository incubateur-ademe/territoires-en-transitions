# PGSync

## Description du besoin

A des fins de test et de debugs, il est nécessaire de disposer de jeux de données les plus représentatifs des données de production. Néanmoins, il est nécessaire de protéger les informations sensibles et anonymiser le plus possible les données.

Pour répondre à ce besoin général, deux besoins plus précis ont été identifiés:
- être capable de copier les données de prod sur l'environnement local
- être capable de copier les données de prod toutes les nuits sur un environnement de staging

Enfin, il est important de noter que le besoin de copie ne concerne pas toute la base de données mais uniquement le sous-ensemble fonctionnel de la base de donnée (c'est à dire les tables utilisées par le portail web). Il existe en effet pour l'instant des données autres (backup, données de statistique, etc) qui ont vocation à être sorties de la base de données de production et ne sont pas copiées par ce mécanisme de synchro.

## Utilisation

ATTENTION: `pgsync` doit être manipulé avec  précaution car il est tout à fait possible techniquement d'écraser la base de production avec la base locale par exemple. Afin de limiter le risque, il est nécessaire d'utiliser les commandes `earthly +db-sync` et `earthly +db-sync-local` qui font certains contrôles (dont le fait que la destination ne contient pas l'identifiant du projet de production).

### Utilisation en local

Utilisez la commande suivante pour copier les données de la base de production ou de pre-production dans votre environnement local.

```shell
earthly +db-sync-local --FROM_DB_URL postgresql://postgres.[ID_PROJET_SUPABASE]:[PWD_DB_SUPABASE]@aws-0-eu-west-3.pooler.supabase.com:6543/postgres
```

### Utilisation dans la CI/CD

Le script [cd-sync.yml](../../.github/workflows/cd-sync.yml) permet de synchroniser la base de staging à partir des données de production toutes les nuits à 1h30. Il utilise pour cela la commande earthly suivante:

```shell
earthly +db-sync --FROM_DB_URL postgresql://postgres.[ID_PROJET_PROD_SUPABASE]:[PWD_DB_PROD_SUPABASE]@aws-0-eu-west-3.pooler.supabase.com:6543/postgres --TO_DB_URL postgresql://postgres.[ID_PROJET_STAGING_SUPABASE]:[PWD_DB_STAGING_SUPABASE]@aws-0-eu-west-3.pooler.supabase.com:6543/postgres
```


