# Tests de charge

On utilise [k6](https://k6.io/) pour obtenir des [résultats](https://k6.io/docs/get-started/results-output/) sur des scénarios d'utilisation.

## Utilisation
Pour lancer le smoke test `smoke.js`, [installer k6](https://k6.io/docs/get-started/installation/) puis :
```sh
k6 run smoke.js
```

### Variables d'environnement
Les variables d'environnement peuvent aussi être passées avec [le flag -e](https://k6.io/docs/using-k6/environment-variables/)
- `SUPABASE_URL`: l'URL de Supabase
- `SUPABASE_KEY`: la clé **anon** de l'API 
- `COLLECTIVITE_ID`: l'id de la collectivité pour laquelle on va changer des données 
- `EMAIL`: L'email à utiliser pour s'identifier
- `PASSWORD`: Le mot de passe de l'utilisateur  
