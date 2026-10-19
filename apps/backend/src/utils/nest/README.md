# Sécurité HTTP et disponibilité

Les applications backend et tools configurent les protections natives Nest dans `configureHttpSecurity` avant les parseurs de corps et les routes Express. Elles couvrent donc aussi tRPC, Swagger et Bull Board.

## Origines autorisées

| Variable               | Contrat                                                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `APP_URL`              | URL HTTP(S) de l'application, sans identifiants ; son origine est autorisée pour CORS et CSRF. Requise au démarrage du backend, facultative dans tools. |
| `SITE_URL`             | Origine HTTP(S) exacte du site public, facultative hors déploiement.                                                                                    |
| `HTTP_ALLOWED_ORIGINS` | Liste CSV d'origines supplémentaires, vide par défaut.                                                                                                  |
| `TRUST_PROXY_HOPS`     | Nombre entier de proxies de confiance entre 0 et 10 ; 0 par défaut pour une connexion directe.                                                          |

`SITE_URL` et chaque entrée de `HTTP_ALLOWED_ORIGINS` doivent être des origines sans chemin, barre oblique finale, paramètres, fragment, identifiants ou joker. Exemple : `https://partenaire.example,http://localhost:3000`. Les noms d'hôte et ports par défaut sont normalisés. Chaque environnement de preview doit être autorisé explicitement.

Les workflows de déploiement transmettent `APP_URL` depuis les variables GitHub d'environnement. Ils résolvent `SITE_URL` avec l'action `get-koyeb-app-url` : variable explicite si présente, origine canonique du site en production, domaine Koyeb de l'application site de l'environnement sinon. Une variable GitHub `HTTP_ALLOWED_ORIGINS` non vide configure les origines additionnelles ; son absence conserve une valeur déjà définie sur la plateforme. Pour supprimer cette configuration, retirer explicitement la variable du service Koyeb. Les arguments contenant cette liste sont échappés pour le parseur CSV du CLI.

CORS autorise les credentials uniquement pour ces origines. La protection CSRF refuse les mutations provenant d'autres origines navigateur, y compris des sous-domaines du même site. Les navigations GET de retour OIDC restent autorisées. Les clients serveur sans métadonnées d'origine navigateur peuvent appeler les API ; l'authentification et les permissions restent nécessaires. CORS et CSRF ne remplacent pas ces contrôles.

La CSP autorise les scripts de la même origine et interdit les scripts exécutables inline. Les assets Swagger et Bull Board satisfont cette politique. HSTS et `upgrade-insecure-requests` sont activés en production et désactivés pour le développement HTTP local.

## Proxy et limites d'appels

Les déploiements Koyeb fixent `TRUST_PROXY_HOPS=1` : Koyeb garantit uniquement la dernière adresse de `X-Forwarded-For`. Le serveur doit rester accessible via cette frontière proxy ; ajuster le nombre de sauts nécessite de vérifier tous les chemins réseau. Les connexions directes gardent 0. tRPC utilise exclusivement `req.ip` résolu par Express, sans lire lui-même l'en-tête fourni par le client.

Les guards REST et les procédures tRPC explicitement limitées utilisent le même stockage Redis, atomique et partagé entre replicas. Les compteurs restent distincts par route/procédure. La normalisation native de `@nestjs/throttler` regroupe les adresses IPv6 par préfixe /64 et normalise les adresses IPv4 mappées.

La connexion reprend les paramètres Redis des queues, y compris TLS et l'épinglage du certificat si configuré. Le préfixe de compteurs est `tet:backend:throttle` ; chaque application créée sous Vitest reçoit un préfixe isolé. Les processus d'un même environnement doivent utiliser le même Redis. Les environnements doivent avoir des Redis ou bases Redis distincts.

Une panne Redis refuse les requêtes limitées. Le démarrage attend au maximum 5 secondes pour la connexion. Les opérations exposées ont un délai de réponse d'une seconde ; la file interne du client est plafonnée à 1 000 commandes et ne conserve pas les nouvelles commandes hors connexion. Une commande déjà envoyée peut terminer après ce délai et consommer un quota : elle n'est pas réessayée par l'application. Cette borne applicative complète celle de node-redis, qui porte sur l'attente avant écriture socket.

## Sondes et arrêt

- `GET /health/live` vérifie que le serveur répond, indépendamment de PostgreSQL et Redis. C'est la sonde configurée sur Koyeb et dans les images Docker.
- `GET /health/ready` vérifie PostgreSQL et Redis avec des délais bornés. Elle retourne 200 si les deux répondent, sinon 503 sans détails d'infrastructure ni identifiants.

Les sondes sont publiques et exemptées des quotas. Utiliser la readiness pour les vérifications de déploiement et la supervision. Les health checks Koyeb servent aussi à redémarrer les instances : y mettre la readiness provoquerait des redémarrages inutiles pendant une panne partagée de base de données.

Les hooks d'arrêt Nest arrêtent les relais outbox puis attendent les workers avant la fermeture des ressources. Les connexions Redis des limites sont détruites à l'arrêt et la télémétrie est vidée. Les tâches longues doivent disposer du délai d'arrêt nécessaire sur la plateforme.

## Vérification locale

Les specs `http-security.spec.ts` et `trpc.service.spec.ts` vérifient les origines, les callbacks GET, la frontière proxy, les quotas tRPC et les assets réellement servis sous CSP, sans fournisseur externe.

La spec `../throttling/rate-limit-storage.service.spec.ts` s'active uniquement avec `RATE_LIMIT_ISOLATED_REDIS_URL`. Cette URL doit désigner un Redis jetable dédié : un test met volontairement ce serveur en pause. Ne pas utiliser le Redis applicatif. Elle vérifie les replicas concurrents, les expirations, l'isolation, la fermeture et la récupération après timeout.

En CI, le workflow `test-runtime-integrations.yml` exécute ces tests Redis puis les tests outbox sur PostgreSQL et Redis propres à ce job. Il ne charge aucun environnement applicatif, secret métier ou fournisseur IA. Les conteneurs sont supprimés à la fin du job. Le job s'active pour les changements backend/tools, les migrations webhooks et sa configuration CI.

Sources : [sécurité HTTP Nest](https://docs.nestjs.com/security/helmet), [CSRF Nest](https://docs.nestjs.com/security/csrf), [frontière proxy Koyeb](https://www.koyeb.com/docs/reference/edge-network), [health checks Koyeb](https://www.koyeb.com/docs/run-and-scale/health-checks).
