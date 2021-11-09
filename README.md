# Territoires en Transition

Dans le cadre des programmes d'accompagnement des collectivités dans leurs
démarches de transition écologique, l'[ADEME (l'Agence de la transition
écologique)](https://www.ademe.fr/) s'est associée à
[beta.gouv.fr](https://beta.gouv.fr/) pour lancer une plateforme numérique
pour faciliter et accélérer la mise en oeuvre des actions de transition
écologique dans les collectivités territoriales.

L'interface a pour objectifs de permettre aux utilisateurs :
- d'accéder aux référentiels d'actions de transition écologique
  (Climat-Air-Énergie et Économie Circulaire) et de personnaliser leur
  utilisation,
- de gérer et suivre ses actions et indicateurs de transition écologique,
- de prioriser les actions ayant le plus d'impact,
- de partager la progression des réalisations et des retours d'expériences
      entre collectivités.

## Organisation du dépôt
Ce dépôt Git contient :
- 3 services : 
    - le ["data-layer"](./data_layer)
    - le ["business"](./business)
    - [l'application]()./app.territoiresentransitions.react)
- les données des référentiels en [markdown](./markdown) 
- le [code du site statique](./territoiresentransitions.fr)

Chaque dossier à la racine contient son propre `README.md` et peut a priori fonctionner
de manière autonome.

Vous pouvez contribuer à notre projet [en suivant cette documentation](docs/workflows/contribuer-au-projet.md).

## Design et choix tehniques

<div align="center">
<img src="design.png" alt="architecture design" >
</div>

TODO : example notation + explication
## Pour lancer l'application en développement avec docker-compose  :
Comin' soon ... 
```
docker-compose up --build 
```

