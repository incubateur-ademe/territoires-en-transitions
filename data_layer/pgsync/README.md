# PGSync

## Description du besoin

Certains tests nécessitent des jeux de données complexes disponibles sur la plateforme de production. Une volonté de pouvoir copier les données de production (anonymisées) vers une plateforme de staging permettant d'effectuer des tests au plus proche des données réelles a donc été identifié.

## Alternatives identifiées

### PGDump

L'utilisation de PGDump directement a été envisagée mais il était nécessaire de ne pas copier toute la base de données de production car certaines tables ne sont plus utilisées ou pas utiles aux tests (ex: statistiques). 

TODO: à compléter

## Utilisation

### ATTENTION

Une protection a été mise en place afin d'éviter la copie VERS la base de production: les scripts vérifient si le paramètre de base de données cible n'inclue pas l'identifiant de la BDD de production.
Il n'empêche qu'une erreur de manipulation est toujours possible en utilisant la ligne de commande de pgsync directement et il est donc nécessaire d'effectuer ces commandes avec toutes les précautions nécessaires.

### Utilisation en local

La commande suivante permet de copier la base de données de production en local

```shell
earthly +db-sync-local --FROM_DB_URL=postgresql://postgres.xbrefnclajfcjlpnwyow:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

### Utilisation dans la CI

Un script CD permet de lancer la copie de la base de données de production vers celle de staging via l'interface gitlab.


