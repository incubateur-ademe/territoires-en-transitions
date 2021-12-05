# Fausses données
Ce dossier contient des requêtes qui permettent d'insérer des fausses données dans la base afin que le client puisse 
tester ces repo de manière isolée. 

Le scénario est le suivant : 
1. Utilisateurs avec des comptes 
                   
a. Utilisateur Yolo:

```yaml
email: yolo@dodo.com
password: yolododo
prenom: Yolo
nom: Dodo
id: 17440546-f389-4d4f-bfdb-b0c94a1bd0f9
droits: 
  - `referent` sur l'EPCI #1 
  - `agent` sur l'EPCI #2 
```

b. Utilisateur Yulu
N'a aucune donnée ni aucun droit
```yaml
email: yulu@dudu.com
password: yulududu
prenom: Yulu
nom: Dudu
id: 298235a0-60e7-4ceb-9172-0a991cce0386
```

c. Utilisateur Yili conseiller

```yaml
email: yili@didi.com
prenom: Yili
nom: Yili
id: 3f407fc6-3634-45ff-a988-301e9088096a
droits: 
  - `conseiller` sur les EPCI #1 and #2
```

d. Utilisateur Yala auditeur

```yaml
email: yala@dada.com
prenom: Yala
nom: Yala
id: 4f407fc6-3634-45ff-a988-301e9088096a
droits: 
  - `auditeur` sur les EPCI #1, #2, #3, #4
```

2. Actions du référentiel


3. Commentaire action référentiel
Commentaire de l'action cae_1.2.3, ajouté par Yolo sur l'epci 1 ('Haut - Bugey Agglomération', '200042935', 'CA')
```yaml
commentaire: un commentaire
action_id: cae_1.2.3
```
