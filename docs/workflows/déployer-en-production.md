# Déployer en production

- [Contexte](#contexte)
- [Préparer un déploiement](#préparer-un-déploiement)
- [Déployer](#déployer)

## Contexte

Actuellement (mai 2021), dans l'équipe de développement, nous disposons
seulement de deux jours par semaine où toutes les personnes sont présentes et en
parallèle de cela, nous avons besoin de vélocité dans cette seconde phase de
construction.

Pour répondre à ces contraintes, nous avons choisi de décorréler la revue de
code et la mise en production (contrairement à un process de CI/CD
traditionnel) :
  - les PRs revues sont mergées dans `main`,
  - les branches à déployer sont mergées dans `production`.

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

## Préparer un déploiement

1. Se mettre sur la branche `production` :
```
git co production
```

2. Récupérer la version de `production` sur `origin` :
```
git pull origin production
```

3. Récupérer la version de `main` sur `origin` :
```
git pull origin main
```

4. Merger les branches que l'on veut déployer. Pour chaque branche :
  - Vérifier qu'il existe une PR associée. Si ce n'est pas le cas, créer la PR
    ou demander à la personne en charge de la fonctionnalité de le faire.
  - Merger la branche :
    ```
    git merge [NOM DE LA BRANCHE]
    ```
  - Fixer les conflits si nécessaire.

5. Mettre à jour le `CHANGELOG.md` :
  - Garder le titre "À venir",
  - Ajouter un titre avec la date du jour au-dessus des modifications que l'on
    vient d'ajouter.
  - Enregistrer cette modification :
    ```
    git add CHANGELOG.md
    git commit -m "Mise à jour du CHANGELOG"
    ```
## Déployer

> Pour pouvoir mettre à jour la branche `production` sur `origin`, il faut
> demander que son compte GitHub soit ajouté à la liste des comptes autorisées
> dans les règles de protection du dépôt pour la branche `production`.

1. Pousser la branche `production` sur `origin` :
   ```
   git push origin production
   ```
2. Vérifier l'avancée du déploiement sur
   https://github.com/betagouv/territoires-en-transitions/actions.

3. Lorsque c'est déployé sans encombre, écrire un message sur le channel
   Mattermost de beta.gouv `startup-labels-produit` pour prévenir l'équipe des
   différentes fonctionnalités et résolution de bugs qui viennent de passer en
   production.

4. Tant que les tests end-to-end ne sont pas implémentés, prendre le temps de
   naviguer sur l'application en production et tester les scénarios principaux.

En cas de problème pendant ou juste après un déploiement, on prévient l'équipe
de développement et si cela les impacte, le reste de l'équipe, **avant d'essayer
de fixer quoique ce soit.**
