## Utilisateur

Représente les informations stockées dans notre base de donnée à propos de l'utilisateur.

Attention on ne stocke pas de Données à Caractère Personnel ici.

```yaml
Utilisateur:
    ademe_user_id:
        type: String
    vie_privee:
        type: String
```

## Inscription utilisateur

Représente les informations transmises à notre API par l'utilisateur lors de son inscription.

```yaml
UtilisateurInscription:
    email:
        type: String
    nom:
        type: String
    prenom:
        type: String
    vie_privee:
        type: String
```

## Utilisateur connecté

Représente les informations transmises au client lors de la connexion d'un utilisateur.
Ce sont les informations transmises avec le jeton OpenId par Keycloak.

```yaml
UtilisateurConnecte:
    ademe_user_id:
        type: String
    access_token:
        type: String
    refresh_token:
        type: String
    email:
        type: String
    nom:
        type: String
    prenom:
        type: String
```





