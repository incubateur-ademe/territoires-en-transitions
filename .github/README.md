# Workflows et actions GitHub

Ce dossier contient la CI, le déploiement et les automatisations de maintenance du dépôt.

## Points d'entrée

Ces workflows répondent à un événement GitHub ou à un lancement manuel depuis l'onglet Actions.

| Workflow                                                         | Déclenchement                                              | Rôle                                                                                 |
| ---------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [main-ci.yml](./workflows/main-ci.yml)                           | Push sur `main` ou lancement manuel sur une branche        | Valider les projets affectés.                                                        |
| [pull-request-ci.yml](./workflows/pull-request-ci.yml)           | PR hors brouillon                                          | Valider les changements de la PR.                                                    |
| [cd.yml](./workflows/cd.yml)                                     | Manuel                                                     | Déployer la stack ; `prod` exige `main` et une CI réussie.                           |
| [cd-preview-app.yml](./workflows/cd-preview-app.yml)             | Manuel                                                     | Déployer un aperçu de l’app par branche sur les ressources preprod.                  |
| [cd-preview-backend.yml](./workflows/cd-preview-backend.yml)     | Manuel                                                     | Déployer le backend de test existant sur staging ou preprod.                         |
| [cd-test-app-destroy.yml](./workflows/cd-test-app-destroy.yml)   | Fermeture d’une PR                                         | Supprimer l’aperçu de l’app associé à la branche.                                    |
| [retry-flaky-jobs.yml](./workflows/retry-flaky-jobs.yml)         | Échec de Main CI ou Pull request CI                        | Relancer une seule fois si seuls les tests backend/API ou les shards E2E ont échoué. |
| [backup-database.yml](./workflows/backup-database.yml)           | Quotidien ou manuel                                        | Sauvegarder la production, puis restaurer staging et preprod.                        |
| [restore-database.yml](./workflows/restore-database.yml)         | Manuel                                                     | Restaurer un backup de production sur staging ou preprod.                            |
| [keep-alive-streamlit.yml](./workflows/keep-alive-streamlit.yml) | Toutes les deux heures ou manuel                           | Maintenir les applications Streamlit actives.                                        |
| [analyze-fiches.yml](./workflows/analyze-fiches.yml)             | Manuel, par un humain                                      | Analyser les fiches action des collectivités sélectionnées via des API IA payantes.  |
| [dev.yml](./workflows/dev.yml)                                   | Utilisation locale avec `act` ; expose `workflow_dispatch` | Préparer et gérer les services Supabase et Redis de test.                            |

## Workflows internes

Le préfixe `_` désigne les workflows appelés via `workflow_call`. Ils ne se lancent pas directement.

| Workflow                                                          | Responsabilité                                                                                   |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [\_ci.yml](./workflows/_ci.yml)                                   | Sélectionner les projets affectés et orchestrer les validations.                                 |
| [\_ci-validate.yml](./workflows/_ci-validate.yml)                 | Lint, build, typecheck et tests unitaires.                                                       |
| [\_ci-storybook.yml](./workflows/_ci-storybook.yml)               | Tester les Storybooks et publier l'UI sur Chromatic.                                             |
| [\_ci-test-db.yml](./workflows/_ci-test-db.yml)                   | Tester les migrations, la compatibilité des backups et les contraintes en base.                  |
| [\_ci-test-backend-api.yml](./workflows/_ci-test-backend-api.yml) | Tester le backend et l'API avec Supabase et Redis.                                               |
| [\_ci-test-e2e.yml](./workflows/_ci-test-e2e.yml)                 | Exécuter les shards Playwright et fusionner leurs rapports.                                      |
| [\_prepare-test-db.yml](./workflows/_prepare-test-db.yml)         | Préparer la base de test pour la CI et `dev.yml`.                                                |
| [\_cd-build.yml](./workflows/_cd-build.yml)                       | Construire ou réutiliser les images et fournir leurs digests.                                    |
| [\_build-app.yml](./workflows/_build-app.yml)                     | Construire l’image app pour le déploiement groupé et les aperçus.                                |
| [\_build-backend.yml](./workflows/_build-backend.yml)             | Construire l’image backend pour le déploiement groupé et les aperçus.                            |
| [\_cd-deploy.yml](./workflows/_cd-deploy.yml)                     | Migrer et vérifier le schéma, déployer les services et garder le verrou jusqu'au contrôle final. |
| [\_cd-check.yml](./workflows/_cd-check.yml)                       | Vérifier les versions déployées et les URLs publiques.                                           |

## Actions locales

Les actions sont regroupées par responsabilité. Les références `uses` partent de la racine du dépôt, par exemple `uses: ./.github/actions/docker/login`.

| Dossier                            | Responsabilité                                                     |
| ---------------------------------- | ------------------------------------------------------------------ |
| [app/](./actions/app/)             | Configuration, démarrage et métadonnées des applications.          |
| [cache/](./actions/cache/)         | Caches des dépendances, builds et outils de test.                  |
| [ci/](./actions/ci/)               | Calcul des projets affectés.                                       |
| [database/](./actions/database/)   | PostgreSQL, seed, Sqitch et services locaux Supabase/Redis.        |
| [docker/](./actions/docker/)       | Authentification au registre, résolution et build/push des images. |
| [node/](./actions/node/)           | Installation pnpm et dépendances natives Node.js.                  |
| [providers/](./actions/providers/) | Intégrations AWS, Koyeb et Streamlit.                              |
| [runner/](./actions/runner/)       | Configuration du système du runner.                                |
| [utils/](./actions/utils/)         | Troncature et attente HTTP.                                        |

## Guides

- [Déployer la stack](../doc/deploiement.md) : environnements, images, configuration et reprise après échec.
- [Utiliser les workflows en local](../doc/workflows-locaux.md) : configuration de `act` et gestion des services de test.
