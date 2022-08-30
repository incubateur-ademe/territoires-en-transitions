# territoiresentransitions.fr
 
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

Ce dépôt Git contient :
- un outil pour extraire les données métiers venant de fichiers divers (`.xls`,
  `.docx`, etc.) sous un format unifié,
- l'application client de l'interface,
- les données des référentiels (fichiers sources et markdown),
- des outils pour le déploiement.

Chaque dossier à la racine contient son propre `README.md` et peut fonctionner
de manière autonome.

Vous pouvez contribuer à notre projet [en suivant cette documentation](docs/workflows/contribuer-au-projet.md).

## Pour lancer l'application en développement avec docker-compose  :
```
docker-compose up --build 
```

