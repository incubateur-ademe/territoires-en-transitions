# Tests de charge

On utilise [k6](https://k6.io/) pour obtenir des [résultats](https://k6.io/docs/get-started/results-output/) sur des scénarios d'utilisation.

## Où en est-on ?
- [x] Tester que le moteur de notation tient la charge.
- [ ] Modéliser la visite d'un utilisateur.
- [ ] Suivre l'évolution des valeurs des résultats des tests.

Aujourd'hui on constate avec le test [evaluation.js](evaluation.js) que le moteur de notation du [business](../business/README.md) tient une charge bien plus élevée (sans erreurs) que ce que nous avons rencontré jusqu'à présent en production. 

Néanmoins, on ne teste pour le moment qu'un périmètre restreint : la notation qui est au cœur de notre produit.
 
### Résultats
Avec le service de notation sur des nodes `S` chez Scalingo, on constate que les temps de réponse s'envolent, le scaling étant à la traine sur la fenêtre de 20mn.

Ceci dit, ces temps de réponse impactent **uniquement** le calcul des scores, les temps de lectures/écriture de la base de donnée reste inchangés.

```
running (20m17.8s), 00/16 VUs, 459 complete and 2 interrupted iterations
default ✓ [======================================] 00/16 VUs  20m0s

     ✓ logged in successfully
     ✓ statut updated successfully

     checks.........................: 100.00% ✓ 5070     ✗ 0   
     data_received..................: 1.5 MB  1.3 kB/s
     data_sent......................: 1.5 MB  1.2 kB/s
     http_req_blocked...............: avg=219.04µs min=0s       med=1µs    max=105.47ms p(90)=1µs    p(95)=1µs     
     http_req_connecting............: avg=86.78µs  min=0s       med=0s     max=38.56ms  p(90)=0s     p(95)=0s      
   ✗ http_req_duration..............: avg=1.28s    min=170.15ms med=1.2s   max=12.83s   p(90)=2.57s  p(95)=3.32s   
       { expected_response:true }...: avg=1.28s    min=170.15ms med=1.2s   max=12.83s   p(90)=2.57s  p(95)=3.32s   
     http_req_failed................: 0.00%   ✓ 0        ✗ 5070
     http_req_receiving.............: avg=105.23µs min=10µs     med=63µs   max=12.05ms  p(90)=131µs  p(95)=289.54µs
     http_req_sending...............: avg=300.35µs min=45µs     med=192µs  max=18.73ms  p(90)=489µs  p(95)=798µs   
     http_req_tls_handshaking.......: avg=123.01µs min=0s       med=0s     max=68.87ms  p(90)=0s     p(95)=0s      
     http_req_waiting...............: avg=1.28s    min=169.76ms med=1.2s   max=12.83s   p(90)=2.57s  p(95)=3.32s   
     http_reqs......................: 5070    4.163093/s
     iteration_duration.............: avg=32.18s   min=26.82s   med=31.69s max=43.15s   p(90)=36.22s p(95)=37.55s  
     iterations.....................: 459     0.376895/s
     vus............................: 1       min=1      max=16
     vus_max........................: 16      min=16     max=16
```

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
