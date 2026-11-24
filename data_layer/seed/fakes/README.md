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

e. Utilisateur Supra (dépôts PCAET portés par un Supra)

```yaml
email: supra@dodo.com
password: yolododo
id: 33333333-5a9a-4bfc-a000-000000000001
droits: cf. 30-insert_fake_pcaet_supra.sql, qui détaille un cas par collectivité
```

f. Utilisateur EPCI couvert par le dépôt d'un Supra

```yaml
email: epci@dodo.com
password: yolododo
id: 33333333-5a9a-4bfc-a000-000000000002
droits: `edition` sur CC Val 81, couverte par le dépôt du SICTOM (lecture seule)
```

2. Statut action référentiel 
```yaml
modified_by: Yolo Dodo (17440546-f389-4d4f-bfdb-b0c94a1bd0f9)
collectivite_id: 1
action: cae_1.1.1.1.1
avancement: fait
concerne: true
```

3. Commentaire action référentiel
Commentaire de l'action cae_1.2.3, ajouté par Yolo sur la collectivité 1 ('Haut - Bugey Agglomération', '200042935', 'CA')
```yaml
commentaire: un commentaire
action_id: cae_1.2.3
collectivite_id: 1
```

4. Indicateur référentiel objectif & résultat 
Résultat : 
```yaml
collectivite_id: 1
indicateur_id: cae_8
annee: 2020
valeur: 20
```

Objectif : 
```yaml
collectivite_id: 1
indicateur_id: cae_8
annee: 2021
valeur: 21
```

5. Plan PCAET en cours, pour l'onglet « Suivi » du plan
Plan « PCAET 2026-2031 » de la collectivité 1, rattaché à la démarche PCAET en élaboration (`25-insert_fake_demarche_pcaet.sql`), avec des fiches aux statuts et jauges variés.
Ses indicateurs couvrent les cas du bloc « Indicateurs et objectifs » : favoris, progression à la baisse et à la hausse, stagnation, régression, objectif dépassé, open data seul, résultats sans objectif, objectif sans résultat, aucune valeur, indicateur confidentiel, indicateur porté par une fiche restreinte, indicateur lié à un axe, indicateur personnalisé.
Le dépôt PCAET y ajoute ses indicateurs réglementaires : les totaux GES, consommation et ENR (année de référence 2018, objectifs du dépôt) et les 6 polluants du seed 25.
Le détail est en tête de `31-insert_fake_plan_pcaet_suivi.sql`. Pour l'ajouter à une base déjà seedée :
```sh
docker exec -i tet-db-1 psql -U postgres -v ON_ERROR_STOP=1 < data_layer/seed/fakes/31-insert_fake_plan_pcaet_suivi.sql
```
