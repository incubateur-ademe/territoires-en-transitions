# Contribuer au projet

Merci à vous de prendre le temps de contribuer à notre projet :)

Vous trouverez ici les informations pour démarrer et comprendre comment nous
travaillons sur ce projet.

- [Discussion avec l'équipe](#discussion-avec-léquipe)
- [Créer une Pull Request](#créer-une-pull-request)
- [Intégration continue et déploiement](#intégration-continue-et-déploiement)

## Discussion avec l'équipe

On utilise GitHub pour suivre l'avancée de nos fonctionnalités et la résolution
de nos bugs. Pour travailler avec nous, vous pouvez [lancer une
nouvelle discussion](https://github.com/betagouv/territoires-en-transitions/issues/new)
ou venir discuter avec nous directement sur Mattermost.

Pensez à jeter un œil à la [liste des issues existantes](https://github.com/betagouv/territoires-en-transitions/issues)
ou à notre [story map](https://github.com/betagouv/territoires-en-transitions/projects/5)
avant d'ouvrir un nouveau sujet.

## Créer une Pull Request

- On crée une nouvelle [Pull Request sur GitHub](https://github.com/betagouv/territoires-en-transitions/compare)
  avec un titre clair en français avec comme base `main`.
- On assigne une personne pour la relecture.
- On met à jour le `CHANGELOG.md` dans la section `À venir` dans la catégorie
  qui convient à la Pull Request (fonctionnalités, réparation de bugs ou tech).
- Lorsque la Pull Request est approuvée, on merge sa Pull Request avec un
  `Squash and merge` en s'assurant que le message de commit est identique au
  titre de la Pull Request.

## Intégration continue et déploiement

On utilise les [GitHub Actions](https://github.com/features/actions) pour lancer
les tests sur chaque Pull Request et pour
[déployer en production](docs/workflows/deployer-en-production.md).

Chaque Pull Request mergée sur `main` sera déployée au prochain déploiement. Le
déploiement est déclenché manuellement au merge sur `production` et est exécuté
automatiquement par une [GitHub Action](https://github.com/betagouv/territoires-en-transitions/actions).
La liste des personnes pouvant merger sur `production` est restreinte à
l'équipe de développement du projet.
