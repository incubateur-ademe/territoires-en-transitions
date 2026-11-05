# ClamAV : analyse antivirus des fichiers déposés

Le backend analyse en différé chaque objet des buckets de collectivité :

1. un cron de `tools` (`scan-fichiers`, toutes les 5 min) appelle `collectivites.documents.scanFichiers` ;
2. cet appel met un balayage dans la queue BullMQ `fichier_scan` ;
3. le worker du backend envoie chaque nouvel objet en flux à clamd et consigne le verdict dans `collectivite_fichier_scan`.

Code : `apps/backend/src/collectivites/documents/scan-fichiers/`.

**Mode actuel : audit.** Les verdicts sont consignés, mais aucun fichier n'est supprimé.

clamd n'a **aucune authentification**. Son port 3310 ne doit être joignable que depuis un réseau privé.

## Image

`infra/clamav/Dockerfile` part de l'image officielle (signatures embarquées, freshclam toutes les heures). Elle relève `StreamMaxLength` à 60M, au-dessus de la limite de 50 Mio de Storage. C'est la même image en local, sur Koyeb et sur Coolify.

## En local

```sh
docker compose --profile clamav up -d --build --wait clamav
```

Ensuite, décommenter `CLAMAV_HOST=localhost` dans `apps/backend/.env`. Sans cette variable, le balayage ne fait rien.

## Koyeb (étape A)

Le service s'appelle `clamav` et vit dans l'app du backend (`<env>-backend`). Il demande au moins 4 Go de RAM et n'a aucune route publique.

1. **Créer le service**, une seule fois, à la main. Les options de port et de type de service sont à confirmer dans la doc Koyeb : il faut que 3310 soit joignable sur le réseau privé (*service mesh*) mais jamais exposé publiquement.
2. **Déployer l'image** par le workflow « Déploiement à la demande de ClamAV » (`cd-clamav.yml`).
3. **Vérifier**, depuis le backend, que clamd répond sur son nom privé. D'après la [doc Koyeb](https://www.koyeb.com/docs/apps/service-discovery-and-mesh), ce nom est `clamav.<env>-backend.internal` ou `clamav.<env>-backend`. Vérifier aussi que le port 3310 n'est pas joignable depuis l'extérieur.
4. **Activer le balayage** : ajouter `--env CLAMAV_HOST=<nom privé>` dans `cd-backend.yml`, puis redéployer le backend.

## Audit du stock existant

1. **Mesurer le stock** avec la requête 1 de `audit-report.sql`.
2. **Accélérer le balayage** le temps d'épuiser le stock : passer `FICHIER_SCAN_BATCH_SIZE` à quelques centaines (50 par défaut).
3. **Suivre l'avancement** avec la même requête 1.
4. **Exporter les fichiers infectés et en erreur** avec les requêtes 2 et 3, et les relire. Un faux positif avéré se requalifie en `clean` (voir l'en-tête du fichier SQL).
5. **Repasser `FICHIER_SCAN_BATCH_SIZE` à sa valeur par défaut.** La suppression des fichiers infectés viendra avec le mode de suppression, après validation du rapport.

## Coolify (étape B, préparée)

- **Backend déjà sur Coolify** : on déploie la même image dans la stack et on pointe `CLAMAV_HOST` sur le réseau Docker interne. Le code ne change pas.
- **Backend encore sur Koyeb** : il ne faut pas exposer clamd sur Internet. Il faut d'abord ajouter un transport HTTPS authentifié derrière l'interface `AntivirusScanner`.
- **Bascule** : staging puis prod, avec un test EICAR à chaque étape, puis suppression du service Koyeb. Les verdicts sont en base, donc rien n'est à rejouer.
