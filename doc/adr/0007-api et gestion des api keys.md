# 5. Api & Gestion des api keys

Date: 2025-05-28

## Statut

Accepté

## Contexte & besoin

La plateforme TeT ne dispose pas d'api publique. Plusieurs besoins ont été identifiés:
- Troyes Champagne Métropole souhaite pouvoir accéder par Api aux valeurs d'indicateur qu'ils ont saisi sur la plateforme afin de créer des leurs propres tableaux de bord.
- Terristory extrait les données de labellisation de la plateforme en utilisant l'api de `PostgRest` avec un token anonyme et on souhaiterait pouvoir documenter et sécuriser cela.

Plus largement, le besoin s'inscrit dans une volonté d'ouverture de la plateforme TeT à des partenaires.

## Décision

Plusieurs décisions ont été prises
- Mettre en place le standard [Oauth2 Client credentials flow](https://auth0.com/docs/get-started/authentication-and-authorization-flow/client-credentials-flow) afin de gérer la sécurisation de l'api. Les clés générées sont associées à des utilisateurs de la plateforme. 
- Seul les hash des clés d'api ainsi que les derniers charactères des clés sont stockés.  
- Exposer et documenter un nombre limité de endpoints correspondants aux besoins actuellement identifiés.
- Annoter les utilisations des endpoints (api publique, usage interne, debug, etc.) pour un meilleur suivi.

### Facteurs de décision

#### Positifs

- Oauth2 Client credentials flow (voir une analyse plus fine [ici](https://auth0.com/blog/why-migrate-from-api-keys-to-oauth2-access-tokens/)):
    - Plus sécurisé (token a durée de vie courte, utilisation des scopes à terme)
    - Standardisé 
    - Moins d'impact sur le dev existant, les tokens générés sont compatibles avec les tokens utilisateur classique.
- Seul les hash des clés d'api sont stockés
    - Plus sécurisé
    - Pas de nécessité d'utiliser Supabase Vault
- Clés associées à des utilisateurs:
    - Profite de la gestion de droit existante
    - Meilleur traçabilité & responsabilité (c'est l'utilisateur qui doit être responsable de son api key)
- Nombre limité de endpoints:
    - Se laisser le temps de la réflexion pour les endpoints/modèles plus complexes (ex: fiches action)
    - Ne pas s'imposer des contraintes trop tôt: une fois le endpoint publié, on se doit d'assurer une rétrocompatibilité lors des évolutions.

#### Négatifs

- Oauth2 Client credentials flow :
    - Un peu plus complexe à mettre en place
- Clés associées à des utilisateurs :
    - S'éloigne un peu de la norme en elle même: "the system must authenticate and authorize the application instead of a user"
- Nombre limité de endpoints :
    - Api peut sembler limité et peut freiner des utilisateurs à son usage en pensant qu'il n'est pas possible de faire une opération et/ou que la mise en place va prendre du temps. 

## Alternatives considérées

### Mise en place d'une Api Key

Plus simple mais moins sécurisé et standardisé.
Eventuellement sous la forme d'un token avec une durée de vie illimitée (voir [ici](https://gist.github.com/j4w8n/25d233194877f69c1cbf211de729afb2)).

## Resources

- Réflexions intéressantes et globalement suivi de ce guide: https://medium.com/procedureflow-engineering/building-api-authentication-at-procedureflow-4d1fe78bb293
- Issue supabase sur le sujet: https://github.com/orgs/supabase/discussions/4419
- Solution proposée par la communauté supabase: https://gist.github.com/j4w8n/25d233194877f69c1cbf211de729afb2
- Supabase vault: https://supabase.com/blog/vault-now-in-beta

