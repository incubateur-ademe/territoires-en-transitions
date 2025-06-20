# 8. Génération de documents PDF depuis l'application

Date : 2025-06-20

## 8.1 Statut

Accepté

## 8.2. Contexte

Dans le cadre de l'évolution des fonctionnalités de la fiche action, la génération d'une fiche au format PDF est demandée par les utilisateurs pour un partage facilité au sein de la collectivité, et en particulier avec les élus.

## 8.3. Décision

- La génération PDF est faite à l'aide de la bibliothèque [react-pdf](https://react-pdf.org/). Cette génération est développée de manière générique, afin d'être facilement réutilisée dans d'autres parties de l'application.
- On utilise en complément la bibliothèque [react-pdf-tailwind](https://github.com/aanckar/react-pdf-tailwind) qui permet d'utiliser les classNames `tailwind` avec les composants de la bibliothèque `react-pdf`.

## 8.4. Conséquences

### 8.4.1. Positives

1. La prise en main de la bibliothèque `react-pdf` est intuitive, et permet de développer rapidement une version fonctionnelle. Elle met entre autres à disposition différents types d'export prêts à l'emploi (dans un nouvel onglet, en téléchargement, etc...).

2. L'ajout d'un en-tête fixe ou encore d'une pagination est rapide et simple à mettre en place.

3. Le développement du PDF en composants React permet d'obtenir un résultat visuel fidèle à l'esprit de l'application.

4. L'utilisation de `react-pdf-tailwind` permet de travailler avec les mêmes classNames que dans le reste de l'application. On peut d'ailleurs configurer la bibliothèque avec les preset `tailwind` défini dans le package `ui` du projet.

### 8.4.2. Négatives

1. La bibliothèque `react-pdf` ne supporte que ses propres composants, il est donc nécessaire de redévelopper les éléments à intégrer au PDF.

2. Les classes css ne sont pas toutes supportées, il faut donc remplacer certains styles. Il en va de même pour les unités de mesure utilisées.

   - Liste des propriétés css valides : https://react-pdf.org/styling#valid-css-properties
   - Liste des unités valides : https://react-pdf.org/styling#valid-units

3. Dans le cadre du projet TeT, nous utilisons la police de caractère Marianne. Celle-ci n'étant pas disponible dans les ressources fournies par la bibliothèque, elle doit être rendue disponible dans le dossier `public` de l'application. La bibliothèque n'a en effet pas accès aux imports de police de caractère via le DSFR.

4. Le contenu des PDF générés est de taille variable, et il est difficile de créer un template qui se comporte comme souhaité dans 100% des cas.

## 8.5. Détail de l'implémentation

### 8.5.1. Template réutilisable

Un template réutilisable a été développé dans `ui/export-pdf/DocumentToExport.tsx` dans le repo de l'app. Ce template accepte un ou plusieurs éléments JSX. Il permet :

- de mettre en forme le document dans sa globalité (padding, font)
- d'intégrer un en-tête par défaut, avec logos et pagination

> Sauf si besoin de mettre à jour l'en-tête, ce composant n'a pas besoin d'être modifié.
> Le template est directement utilisé par le bouton d'export présenté ci-après, il n'est donc pas non plus nécessaire de réutiliser le template si on utilise le bouton d'export.

### 8.5.2. Bouton d'export

Un bouton d'export réutilisable est disponible dans `ui/export-pdf/ExportPDFButton.tsx` dans le repo de l'app. Ce bouton accepte un ou plusieurs éléments JSX. Il gère :

- la génération du PDF à partir du contenu fourni et du template
- la gestion des erreurs (message dans un toaster, remontée Sentry)
- la requête de la donnée au composant parent uniquement lorsqu'un click de l'utilisteur est détecté (optionnel) - Utilisé par exemple dans le cadre de la fiche action, pour ne requêter que les données nécessaires en fonction de la sélection de l'utilisateur, et ne faire cette requête qu'au moment où l'utilisateur clique sur le bouton d'export. Cela évite de charger toute la donnée au chargement de la page.

Par défaut, un document PDF est téléchargé automatiquement. Il est possible de passer la variable `TEST_MODE` à `true` pour ouvrir le document dans un nouvel onglet (utile en mode dev).

Toutes les propriétés de customisation du composant `Button` sont disponibles, afin d'adapter le bouton au cas d'usage.

### 8.5.3. Composants génériques

Des composants génériques réutilisables sont disponibles dans le dossier `ui/export-pdf/components` de l'app.

Le principe est toujours le même :

- faire une surcouche générique sur un composant de la bibliothèque `react-pdf`
- conserver les propriétés par défaut des composant de la bibliothèque (par exemple `debug`, utile en mode dev)
- injecter l'utilitaire `react-pdf-tailwind`

Cela permet ensuite de développer le contenu du PDF de la même manière que le reste de l'application, en appliquant directement les classNames `tailwind` aux composants utilisés.

> Lorsque le développement d'un nouveau composant est nécessaire :
>
> - il est recommandé dans un premier temps de développer un composant générique dans ce dossier `ui/export-pdf/components`, en suivant les mêmes principes que présentés au dessus
> - utiliser ensuite uniquement le composant "surcouche" pour garder en lisibilité dans l'app (composants React "classiques", pas d'import nécessaire de `react-pdf` ou de `react-pdf-tailwind`)

## 8.6. Alternatives considérées

- Bibliothèques de génération server side : difficile de restituer de manière fidèle le design system de l'application.
- Impression de la page au format PDF via le gestionnaire d'impression natif du navigateur : la mise en page de l'application ne se prête pas à cette solution pour un rendu propre.

## 8.7. Références

- Documentation react-pdf : https://react-pdf.org/
- Repo react-pdf-tailwind : https://github.com/aanckar/react-pdf-tailwind
