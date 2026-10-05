# 9. Site public administrable

Date : 2025-07-01

## 9.1 Statut

Accepté

## 9.2. Contexte

- Fusion des site publics de Territoire Engagé Transition Écologique (TETE) et Territoires en Transitions (TeT) à l'été 2023 : besoin de combiner les besoins des deux équipes en terme de visibilité et de mise à jour des contenus.
- La section actus du site TETE était gérée via Wordpress.
- L'équipe com de TETE doit avoir la main sur les contenus relatifs au programme.
- La page actus doit être administrable à la fois par l'équipe com de TETE et l'équipe déploiement de TeT.

## 9.3. Décision

Utilisation de [Strapi](https://docs.strapi.io/) : v4 à l'origine, [Strapi 5](https://docs.strapi.io/cms/migration/v4-to-v5/introduction-and-faq) depuis octobre 2026.

## 9.4. Conséquences

### 9.4.1. Positives

1. L'équipe com du programme TETE est autonome pour la mise à jour des contenus relatifs au programme, sans intervention des développeurs.
2. Contrairement à l'ancienne solution utilisée par le programme TETE, le front-end est entièrement customisable.

### 9.4.2. Négatives

1. "Allourdissement" du code front-end du site car la majorité du contenu est administrable via Strapi.
2. Strapi ne fournit pas de client typé pour l'API REST : le site décrit lui-même la forme des réponses (`apps/site/src/strapi/types.ts` et un type par content-type à côté de chaque page).
3. Le développement front-end doit anticiper des contenus aux tailles variables, à moins de prévoir une restriction dans les formulaires Strapi.
4. Depuis Strapi 5, chaque entrée a une version brouillon et une version publiée : on peut préparer une modification sans la publier. L'API publique du site ne lit que la version publiée.
5. Lors du premier lancement en local, il n'y a aucune donnée enregistrée dans les différents champs (à l'exception des champs avec une valeur par défaut).

## 9.5. Détails techniques

### 9.5.1. Configuration

#### Pour travailler avec la version locale de Strapi Admin

Dans le repo `apps/site`, mettre à jour le `.env` :

```
NEXT_PUBLIC_STRAPI_KEY=
NEXT_PUBLIC_STRAPI_URL=http://127.0.0.1:1337
```

La clé doit être générée depuis l’interface Strapi Admin lancée en local, dans le menu **Settings** - **API Tokens** - **Create new API Token**.

#### Pour travailler avec la version prod de Strapi Admin

Pour les modifications uniquement front-end, il est possible de requêter l'environnement de prod de Strapi Admin. Pour cela, remplacer les variables dans le `.env` par les valeurs stockées dans le gestionnaire de mot de passe.

### 9.5.2. Lancement de Strapi Admin en local

Lancer la commande `npm run develop` depuis le repo `strapi`.

> Au premier lancement :
>
> - Créer un compte sur Strapi Admin en local (une fenêtre d'inscription apparait au lancement de Strapi).
> - Certaines données sont préremplies. D’autres champs seront à compléter pour pouvoir charger la page associée. Dans tous les cas, les données doivent être publiées pour être dispo côté front (elles sont en `Draft` par défaut, cliquer sur le bouton `Publish` en haut à droite de la page dans le Content Manager).

### 9.5.3. Mise à jour des collections

- La mise à jour des collections se fait uniquement depuis Strapi Admin lancé en local.
- La création ou mise à jour des types ou des components se fait depuis le Content-Type-Builder.
- Pour mettre en production les collections mises à jour :
  - pousser les modifications sur la branche `strapi-updates`
  - se connecter à Strapi Cloud et cliquer sur `Trigger deployment` (par défaut, la branche connectée est `strapi-updates`)
- Une fois les modifications poussées en prod, les droits d’accès et d'édition aux collections se configurent depuis Strapi Admin en prod, dans le menu **Settings** - **Administation panel** - **Roles**.
  - Par défaut, les nouvelles collections ne sont pas accessibles aux utilisteurs de type éditeur. Il faut donc faire la mise à jour pour les champs éditables par l'équipe com du programme TETE.
- Si besoin, il est possible de changer les labels des différents inputs et de rajouter des indications pour les utilisateurs depuis le **Content Manager** de Strapi Admin en prod (menu **Configure the view**).

> **Note :**
> Strapi Cloud est connecté à la branche `strapi-updates` plutôt que `main` car les nouvelles fonctionnalités sont souvent développées dans leur globalité sur la même branche (modifications à la fois dans `apps/site` et dans `strapi`).
>
> De cette manière, les modifications faites dans `strapi` peuvent être déployées sans avoir à pousser les modifications faites dans `apps/site` sur `main` (l'environnement de test du site est connecté à l'environnement de prod de Strapi Admin).

## 9.6. Références

- Documentation Strapi : https://docs.strapi.io/
- Migration v4 → v5 : https://docs.strapi.io/cms/migration/v4-to-v5/introduction-and-faq
