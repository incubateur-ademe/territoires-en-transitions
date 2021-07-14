# Stratégie de test

## Philosophie

Nous pensons que la stratégie de test est évolutive, surtout en début de projet.
Un projet testé entièrement demande un temps, un investissment et une complexité
pas toujours nécessaire lorsque les choix de conception et de fonctionnalités ne
sont pas clairs ou déterminés.

Nous avons donc choisi de tester le code du projet en fonction de sa probabilité
à complètement changer. L'intention est la suivante :
- le code métier back en Python est testé entièrement unitairement : les
  objectifs et les actions qui vont être nécessaires aux EPCIs sont plus ou
  moins scopés. On s'assure donc que ces actions fonctionnent bien quelque
  soient les contextes de manière unitaire.
- le code UX/UI front est testé de manière fonctionnelle : une partie des
  interactions utilisateurs sont en cours de test (via les entretiens
  utilisateurs). L'interface peut donc être amenée à énormément changer. On
  s'assure donc simplement que l'accès aux fonctionnalités est cohérent et
  fonctionnel avec des tests end-to-end sur les happy paths et des tests
  unitaires sur le store et les utilitaires.

## Historique

## Juillet 2021
- Écriture des premiers tests end-to-end et ajout des tests unitaires sur
  l'application client pour https://app.territoiresentransitions.fr

## Juin 2021
- Mise en place de [Cypress](https://www.cypress.io/) pour lancer des tests
  end-to-end en local et dans le CI.

## Mai 2021
- Choix du framework de tests end-to-end à ajouter pour tester les scénarios
  principaux ([Puppeteer](https://pptr.dev/)).

## Avril 2021
- Ajout du [nouveau client](https://github.com/betagouv/label-transition-ecologique/tree/main/app.territoiresentransitions.fr)
avec [Sapper](https://sapper.svelte.dev/) :
  - Pas de tests mis en place (prototypage)

## Mars 2021
- Mise en place de l'[API](https://github.com/betagouv/api-label-transition-ecologique) :
  - Tests unitaires avec [pytest](https://docs.pytest.org/en/6.2.x/)

## Février 2021
- Mise en place du [client](https://github.com/betagouv/label-transition-ecologique/tree/main/client)
avec des pages HTML et quelques scripts JavaScript :
  - Tests unitaires des méthodes utilitaires avec [Chai](https://www.chaijs.com/)
    et [Mocha](https://mochajs.org/).

## Janvier 2021
- Mise en place de [codegen](https://github.com/betagouv/label-transition-ecologique/tree/main/codegen) :
  - Tests unitaires en place avec [pytest](https://docs.pytest.org/en/6.2.x/)
