# Déploiement manuel

Cette documentation sert pour le déploiement manuel à partir d'une machine en
local en cas de souci avec les GitHub Actions.

- [Génération d'une paire de clés d'API sur Scaleway](#génération-dune-paire-de-clés-dapi-sur-scaleway)
- [Installation de aws-cli](#installation-de-aws-cli)
- [Configuration de aws-cli](#configuration-de-aws-cli)
- [Commande de déploiement manuel](#commande-de-déploiement-manuel)

## Génération d'une paire de clés d'API sur Scaleway

Avoir une paire de clés d'API sur Scaleway nous permet d'avoir une permission
unique pour se connecter à l'espace de
stockage de Scaleway ([Scaleway Object Storage](https://www.scaleway.com/en/docs/object-storage-feature/))
où sont conservés les fichiers de notre application cliente.

Pour générer une paire de clés d'API, on peut suivre la documentation de
Scaleway à ce sujet : https://www.scaleway.com/en/docs/generate-api-keys/.

Après cela, on dispose donc d'une clé d'accès, qu'on va nommer `ACCESS_KEY` tout
au long de la documentation, ainsi qu'une clé secrète `SECRET_KEY`.

## Installation de aws-cli

`aws-cli` est l'outil en ligne de commande qui va nous permettre de communiquer
et d'exécuter des actions sur les buckets de notre
[Scaleway Object
Storage](https://www.scaleway.com/en/docs/object-storage-feature/).

1) Installer `aws-cli` en fonction de son environnement local. Pour cela, on
   peut suivre la documentation d'AWS qui sera le plus à jour sur ce sujet :
   https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html.

2) Install `awscli-plugin-endpoint` pour permettre à `aws-cli` de prendre en
   compte des endpoints personnalisés :
```bash
pip3 install awscli-plugin-endpoint
```

## Configuration de aws-cli

1) Créer le fichier `~/.aws/config` en exécutant la commande :
```
aws configure set plugins.endpoint awscli_plugin_endpoint
```

2) Ouvrir ce fichier et l'éditer comme cela :
```
[plugins]
endpoint = awscli_plugin_endpoint

[default]
region = fr-par
s3 =
  endpoint_url = https://s3.fr-par.scw.cloud
  signature_version = s3v4
  max_concurrent_requests = 100
  max_queue_size = 1000
  multipart_threshold = 50MB
  # Edit the multipart_chunksize value according to the file sizes that you want to upload. The present configuration allows to upload files up to 10 GB (100 requests * 10MB). For example setting it to 5GB allows you to upload files up to 5TB.
  multipart_chunksize = 10MB
s3api =
  endpoint_url = https://s3.fr-par.scw.cloud
```

3) Lancer la commande suivante pour générer le fichier de permissions
   `~/.aws/credentials` avec ses clés d'API `ACCESS_KEY` et `SECRET_KEY` :
```
aws configure
```

4) Vérifier que le fichier contient bien les informations suivantes :
```
[default]
aws_access_key_id=<ACCESS_KEY>
aws_secret_access_key=<SECRET_KEY>
```

5) Dans la console, lancer la commande suivante pour vérifier que l'on peut bien
   se connecter au bucket de notre [Scaleway Object Storage](https://www.scaleway.com/en/docs/object-storage-feature/).
```
aws s3 ls
```

## Commande de déploiement manuel

Pour déployer sur sandbox, lancer à la racine du projet :
```
make deploy_all_on_sandbox
```

### Déploiement en production

Avant de déployer en production, suivre toutes les étapes de la section "Préparer un déploiement" de la [documentation "Déployer en production](deployer-en-production.md).

Puis, au lieu de pousser sur la branche `production`, lancer à la racine du projet :
```
make deploy_all_on_app
```

Pour terminer, prévenir l'équipe du déploiement sur le channel Mattermost
`startup-labels-produit` et vérifier que l'application fonctionne correctement
sur https://app.territoiresentransitions.fr.

## Ressources

- Scaleway - clés d'API :  https://www.scaleway.com/en/docs/generate-api-keys/
- Scaleway - Object Storage : https://www.scaleway.com/en/docs/object-storage-feature/
- Scaleway - aws-cli avec Object Storage : https://www.scaleway.com/en/docs/object-storage-with-aws-cli/
- aws-cli - installation : https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html
