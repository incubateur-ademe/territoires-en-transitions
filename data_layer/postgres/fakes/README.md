# Fausses données
Ce dossier contient des requêtes qui permettent d'insérer des fausses données dans la base afin que le client puisse 
tester ces repo de manière isolée. 

Le scénario est le suivant : 
1. Utilisateurs avec des comptes 
                   
a. Utilisateur Yolo:
A des données pour l'epci `id` 1
```yaml
email: yolo@dodo.com
password: yolododo
```

b. Utilisateur Yulu
N'a aucune donnée ni aucun droit
```yaml
email: yulu@dudu.com
password: yulududu
```

2. Actions du référentiel


3. Commentaire action référentiel
Commentaire de l'action cae_1.2.3, ajouté par Yolo sur l'epci 1 ('Haut - Bugey Agglomération', '200042935', 'CA')
```yaml
commentaire: un commentaire
action_id: cae_1.2.3
```
