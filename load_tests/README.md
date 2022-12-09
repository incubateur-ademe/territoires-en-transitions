# Tests de charge

On utilise [k6](https://k6.io/) pour obtenir des [résultats](https://k6.io/docs/get-started/results-output/) sur des scénarios d'utilisation.

Ces scénarios nous permettent de valider notre approche, pas de tester une infrastructure qui de toute façon repose principalement sur Supabase en BaaS. 

## Où en est-on ?
- [x] Tester que le moteur de notation tient la charge.
- [ ] Utiliser plusieurs utilisateurs de tests, Supabase ayant désormais intégré le "rate-limiting" on obtient des codes `429` sur la partie auth.
- [ ] Modéliser la visite d'un utilisateur.
- [ ] Suivre l'évolution des valeurs des résultats des tests.

Aujourd'hui, on constate avec le test [evaluation.js](evaluation.js) que le moteur de notation du [business](../business/README.md) tient une charge bien plus élevée (sans erreurs) que ce que nous avons rencontré jusqu'à présent en production. 

Néanmoins, on ne teste pour le moment qu'un périmètre restreint : la notation qui est au cœur de notre produit.
 
### Résultats
Avec le service de notation sur des nodes `S` chez Scalingo, on constate que les temps de calcul s'envolent, le scaling étant à la traine sur une fenêtre de 20mn.

Ceci dit, les temps de réponse de l'application restent inchangés, l'appel au moteur étant [asynchrone depuis Postgres](https://github.com/supabase/pg_net/).  

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
