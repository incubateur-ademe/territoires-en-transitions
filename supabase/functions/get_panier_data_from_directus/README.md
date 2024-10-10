# get_panier_data_from_directus

## Description

Importe le contenu des fiches du panier d'action à impact depuis le CMS Directus.

## Configuration

| Variable           | Description                          |
| ------------------ | ------------------------------------ |
| `DIRECTUS_API_KEY` | Identifiant d'accès à l'API Directus |

## Exécuter l'import

Une fois la fonction déployée sur l'environnement cible, utiliser la requête SQL suivante en remplaçant `<SUPABASE_API_URL>` et `<SUPABASE_SERVICE_ROLE_KEY>` par les valeurs de l'environnement voulu.

```sql
select net.http_post(
               url := '<SUPABASE_API_URL>/functions/v1/get_panier_data_from_directus',
               body := null,
               headers := jsonb_build_object(
                       'Content-Type', 'application/json',
                       'apikey' , '<SUPABASE_SERVICE_ROLE_KEY>',
                       'Authorization',  concat('Bearer ','<SUPABASE_SERVICE_ROLE_KEY>')
              )
       );
```
