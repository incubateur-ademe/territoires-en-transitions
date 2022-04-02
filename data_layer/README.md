# Data-Layer
Le Data-Layer est responsable des lectures/écritures en base, c'est à dire de:

- stocker des données
    - provenant du business (referentiel, scores calculés...)
    - provenant du client (toutes valeurs saisies dans l'application)
- notifier d'un changement en base
    - au business (ex : nouveau statut d'une action, qui déclenchera le moteur de notation pour mettre à jour les
      scores)
    - au client (ex : un nouveau score a été calculé, donc les jauges doivent être mises à jour dynamiquement)
- fournir au client des vues prêtes à consommer

## Organisation du dossier
- `postgres/content` : le contenu exporté par le `business`. Destiné à disparaitre, `business` stockera directement les
  données par la suite
- `postgres/definitions` : le schema du datalayer, les modèles, types et fonctions.
- `postgres/fakes` : des fausses données utilisées pour développer/tester [readme](data_layer/postgres/fakes/README.md)
- `postgres/tests` : début de tests en sql, on utilisera [pgtap](https://pgtap.org/) par la suite 
- `requests` : des requêtes http pour tester l'API [readme](data_layer/requests/README.md)
- `test_only_docker` : une appli docker compose utilisée pour développer/tester

## Mode d'emploi

### Pré-requis
- psql (on peut l'installer sur Mac avec brew : `brew install postgresql`)
- docker

### Dev / tests avec docker

Aller dans le dossier `./test_only_docker` et exécuter :

```bash
 docker-compose up --build
```
Ensuite 
- utiliser `insert_all.sh` pour insérer les contenus de test.
- redémarrer le container `postgrest` après les insertions pour que l'API soit régénérée avec `docker-compose restart rest  `.


## Créer un projet sur Supabase
Après la création du projet
- Mettre à jour `Site URL` dans `auth/settings` avec l'url du front.
- Mettre à jour les mails `authentication` avec les traductions depuis `auth/templates`.
- Désactiver la confirmation des mails `Enable email confirmations` depuis `auth/settings`.
- Augmenter le nombre `Max rows` à `6000` depuis `settings/api`, 
le business ayant besoin de récupérer toutes les actions en une seule requête
et le client de récupérer tous les noms des collectivités.

Pour utiliser ce nouveau projet avec les autres services
il faut mettre à jour les variables d'environnement :
- du client avec
  - l'url du projet `https://{ID}.supabase.co`
  - la clé d'API publique **anon**
- du business avec
  - l'url http du projet `https://{ID}.supabase.co`
  - le websocket `wss://{ID}.supabase.co`
  - la clé privée **service_role**
  - l'url postgres `postgresql://postgres:{PASSWORD}@db.{ID}.supabase.co:5432/postgres`
