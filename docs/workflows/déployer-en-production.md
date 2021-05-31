# Déployer en production

- [Préparer un déploiement](#préparer-un-déploiement)
- [Déployer](#déployer)

Pour en savoir davantage sur le contexte, on peut consulter la [documentation sur les choix techniques de notre process de déploiement](docs/choix-techniques/intégration-continue-et-déploiement.md).

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
