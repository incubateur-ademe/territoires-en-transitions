# Setup pour un environnement de staging

Cette documentation peut être utilisée pour créer des environnements de
recettage. On appelle `staging` l'environnement de recettage par défaut.

## Pré-requis

- accès à l'interface Scaleway de LTE
- accès à l'interface Gandi de LTE
- aws-cli

Pour les accès, on peut demander à une personne de l'équipe de nous créer des
accès dédiés pour Scaleway et Gandi.

Pour l'installation de aws-cli, on peut suivre la [documentation sur le
déploiement manuel)[docs/workflows/déploiement-manuel.md].

## Choisir un nom de sous-domaine

On se concerte avec l'équipe pour choisir le nom du sous-domaine que l'on
souhaite. Dans cette documentation, l'exemple étudié sera pour
`staging.territoiresentransitions.fr`.

## Créer le bucket de stockage sur Scaleway

Sur Scaleway, un bucket est un espace de stockage nommé qui permet de stocker
toutes sortes d'objets (documents, images, vidéos, etc.). On peut lire davantage
sur Object Storage de Scaleway sur leur documentation :
https://www.scaleway.com/en/docs/object-storage-feature/.

Pour notre projet, on va créer un bucket par environnement. C'est dans ce bucket
qu'on va stocker les fichiers de l'application cliente.

1) On se connecte à la console Scaleway, on va dans la section **Object
   Storage** et on crée un nouveau bucket. Le nom du bucket doit correspondre au
   sous-domaine sur lequel on veut pointer. Ici, le nom du bucket sera
   `staging.territoiresentransitions.fr`.

2) On configure les contrôles d'accès
   ([ACL](https://docs.aws.amazon.com/AmazonS3/latest/dev/acl-overview.html)) sur le bucket avec aws-cli :
```
aws s3api put-bucket-acl --bucket staging.territoiresentransitions.fr --acl public-read
```

## Créer une entrée DNS sur Gandi

1) On retrouve le nom de domaine de notre bucket sur l'interface de Scaleway.
   Dans la liste des buckets, on clique sur le nom, puis on va chercher le **Bucket
   endpoint**.
2) On se connecte à l'interface de Gandi et on va sur l'onglet des entrées DNS.
3) On ajoute une nouvelle entrée avec les informations suivantes :
- nom : <LE_NOM_DE_VOTRE_ENVIRONNEMENT>
- valeur : <LE_BUCKET_ENDPOINT>
  La valeur de TTL peut être discutée avec toute l'équipe si cela peut impacter
  les utilisateurs.

## Activer la fonctionalité website sur le bucket de stockage

Afin que le nom de domaine pointe automatiquement sur la page `index.html`, on
peut activer la [fonctionnalité website](https://www.scaleway.com/en/docs/s3-bucket-website/)
du bucket.

Pour cela, on crée un fichier de configuration nommé `bucket-website.json` :
```json
{
    "IndexDocument" : {
        "Suffix": "index.html"
    },
    "ErrorDocument": {
        "Key": "error.html"
    }
}
```

Et on l'envoie sur le bucket avec la commande suivante :
```sh
aws s3api put-bucket-website --bucket staging.territoiresentransitions.fr --website-configuration file://bucket-website.json
```

## Ressources
- S3 Object Storage - Customizing URLs with CNAME : https://www.scaleway.com/en/docs/s3-customize-bucket-domain/
- S3 Object Storage - How to create static website : https://www.scaleway.com/en/docs/s3-bucket-website/
