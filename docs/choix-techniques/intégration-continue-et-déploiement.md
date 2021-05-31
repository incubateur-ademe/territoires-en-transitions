# Intégration continue et déploiement

- [Contexte](#contexte)
- [Environnements](#environnements)

## Contexte

Actuellement (mai 2021), dans l'équipe de développement, nous disposons
seulement de deux jours par semaine où toutes les personnes sont présentes et en
parallèle de cela, nous avons besoin de vélocité dans cette seconde phase de
construction.

Pour répondre à ces contraintes, nous avons choisi de décorréler la revue de
code et la mise en production (contrairement à un process de CI/CD
traditionnel). Les PRs revues sont mergées dans `main`, les branches à déployer
sont mergées dans `production`.

Avantages :
  - On peut mettre en production facilement sans avoir besoin que le code soit
    relu.
  - Le code de référence sur `main` est relu ; on tire les branches de
    développement à partir de `main`.

Inconvénients :
  - Le merge sur `production` se faisant manuellement par une personne, il y a
    un risque de merger quelque chose sur `production` qui ne ferait jamais
    l'objet d'une PR et qui ne serait donc jamais mergé sur `main`.
  - Le déploiement est fait manuellement et est donc sujet à l'erreur humaine.

Pour connaitre les étapes spécifiques pour déployer en production, on peut
[suivre cette
documentation](https://github.com/betagouv/territoires-en-transitions/blob/main/docs/workflows/d%C3%A9ployer-en-production.md).

## Environnements

On dispose de deux environnements pour l'application client :
  - sandbox accessible sur l'URL http://sandbox.territoiresentransitions.fr,
  - production accessible sur l'URL https://app.territoiresentransitions.fr.

L'hébergement des contenus de ces environnements se trouve sur [notre espace de
stockage Scaleway](https://www.scaleway.com/en/docs/object-storage-feature/).

La gestion des DNS est faite sur Gandi.

La gestion du certificat SSL passe par Cloudflare.

Les accès pour ces différents services sont restreint aux personnes de
l'équipe du projet.
