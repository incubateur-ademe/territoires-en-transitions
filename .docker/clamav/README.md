# ClamAV : analyse antivirus des fichiers déposés

Le backend analyse en différé chaque objet des buckets de collectivité, sans jamais bloquer le dépôt. Deux déclencheurs :

1. **À chaque dépôt** : `StoreDocumentService.storeDocument` met le fichier en file (job `scan-fichier` de la queue BullMQ `fichier_scan`). L'analyse suit en quelques secondes.
2. **Balayage horaire, en filet de sécurité** : un cron de `tools` (`scan-fichiers`) appelle `collectivites.documents.scanFichiers`, qui met un balayage en file. Il rattrape ce qui a échappé à la file : écriture directe dans un bucket, clamd indisponible, stock existant.

Le worker envoie chaque objet en flux à clamd et consigne le verdict dans `collectivite_fichier_scan`.

Code : `apps/backend/src/collectivites/documents/scan-fichiers/`.

Deux modes, réglés par `FICHIER_SCAN_MODE` :

- **`audit`** (par défaut) : les verdicts sont consignés, rien n'est supprimé, et les utilisateurs ne voient aucune différence.
- **`enforce`** : un fichier infecté est supprimé du stockage. Ses lignes métier (bibliothèque, preuves, annexes) sont conservées. Les administrateurs de la collectivité reçoivent un email, et le même contenu ne peut plus être redéposé. Le balayage supprime aussi les infectés consignés pendant l'audit.

Chaque suppression est loguée en `error` (Sentry). Un fichier n'est jamais supprimé sans verdict positif : une erreur d'analyse le laisse en place.

clamd n'a **aucune authentification**. Son port 3310 ne doit être joignable que depuis un réseau privé.

## Image

`.docker/clamav/Dockerfile` part de l'image officielle (signatures embarquées, freshclam toutes les heures). Elle relève `StreamMaxLength` à 60M, au-dessus de la limite de 50 Mio de Storage. C'est la même image en local, sur Koyeb et sur Coolify.

## En local

```sh
docker compose --profile clamav up -d --build --wait clamav
```

Ensuite, décommenter `CLAMAV_HOST=localhost` dans `apps/backend/.env`. Sans cette variable, l'analyse est désactivée.

## Koyeb (étape A)

Le service s'appelle `clamav` et vit dans l'app du backend (`<env>-backend`). Il demande au moins 4 Go de RAM et n'a aucune route publique.

1. **Créer le service**, une seule fois, à la main. Les options de port et de type de service sont à confirmer dans la doc Koyeb : il faut que 3310 soit joignable sur le réseau privé (*service mesh*) mais jamais exposé publiquement.
2. **Déployer l'image** par le workflow « Déploiement à la demande de ClamAV » (`cd-clamav.yml`).
3. **Vérifier**, depuis le backend, que clamd répond sur son nom privé. D'après la [doc Koyeb](https://www.koyeb.com/docs/apps/service-discovery-and-mesh), ce nom est `clamav.<env>-backend.internal` ou `clamav.<env>-backend`. Vérifier aussi que le port 3310 n'est pas joignable depuis l'extérieur.
4. **Activer l'analyse** : ajouter `--env CLAMAV_HOST=<nom privé>` dans `cd-backend.yml`, puis redéployer le backend. Le mode reste `audit`.

## Audit du stock existant

1. **Mesurer le stock** avec la requête 1 de `audit-report.sql`.
2. **Accélérer le balayage** le temps d'épuiser le stock : passer `FICHIER_SCAN_BATCH_SIZE` à quelques centaines (50 par défaut). Le lot part toutes les 5 min en mode audit seul, toutes les heures une fois la suppression livrée : à dimensionner en conséquence.
3. **Suivre l'avancement** avec la même requête 1.
4. **Exporter les fichiers infectés et en erreur** avec les requêtes 2 et 3, et les relire. Un faux positif avéré se requalifie en `clean` (voir l'en-tête du fichier SQL).
5. **Repasser `FICHIER_SCAN_BATCH_SIZE` à sa valeur par défaut.**
6. **Basculer en suppression**, une fois le rapport validé et le marquage des fichiers supprimés livré dans l'app : ajouter `--env FICHIER_SCAN_MODE=enforce` dans `cd-backend.yml`. Le balayage suivant supprime les infectés de l'audit et prévient leurs administrateurs.

## Coolify (étape B)

- **Backend déjà sur Coolify** (preprod) : `infra/coolify/applications.tf` déploie l'image officielle sur le serveur, sans domaine, sous l'alias réseau `clamav` ; le manifeste pose `CLAMAV_HOST=clamav` au backend. Après `terraform apply` : déployer `clamav` dans Coolify (bouton **Deploy**), attendre qu'il soit *healthy* (chargement des signatures, ~5 min), puis redéployer le backend.
- **Backend encore sur Koyeb** : il ne faut pas exposer clamd sur Internet. Il faut d'abord ajouter un transport HTTPS authentifié derrière l'interface `AntivirusScanner`.
- **Bascule** : staging puis prod, avec un test EICAR à chaque étape, puis suppression du service Koyeb. Les verdicts sont en base, donc rien n'est à rejouer.
