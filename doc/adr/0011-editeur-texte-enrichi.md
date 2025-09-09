# 11. Choix de la bibliothèque d’éditeur de texte enrichi

**Date :** 2025-09-08  
**Statut :** Proposition

## Contexte

Plusieurs fonctionnalités nécessitent un éditeur de texte enrichi (formatage, listes, liens, historique). Nous souhaitons une solution moderne, modulaire, performante et bien intégrée à React, avec un bon écosystème d’extensions et une documentation de qualité.

Critères étudiés :

- Modularité / composabilité  
- Popularité / maturité écosystème  
- Intégration et ergonomie avec React  
- Poids du bundle / tree-shaking  
- Richesse fonctionnelle  
- Facilité de prise en main  
- Qualité de la documentation et des exemples  

## Décision

Nous adoptons **BlockNote** ([blocknote.dev](https://blocknote.dev)) pour les éditeurs de texte enrichi.

### Motivations principales

- **Simplicité et rapidité de mise en œuvre** : BlockNote permet une implémentation rapide d’un éditeur fonctionnel (mode "bloc" comme Notion) avec **moins de code**, ce qui facilite le développement et l’intégration dans les applications existantes.
- **Approche React-first et bien intégrée** : Il propose une API simple et native pour React, sans nécessiter de configuration complexe ni de wrapping manuel.
- **Conception modulaire et extensible** : Bien que moins flexible à l’extrême niveau que Lexical ou Slate, il reste modulaire via des plugins et composants officiels.
- **Sécurité intégrée** : Il intègre des mécanismes de sécurité (sanitization) au niveau du rendu et permet facilement la gestion des formats de stockage (HTML, Markdown).
- **Qualité de l’expérience développeur** : Une documentation claire et des exemples concrets sont disponibles, avec une bonne couverture des fonctionnalités courantes (formatage, listes, liens, etc.).

### Comparaison avec les alternatives (résumé)

| Solution | Modularité / composabilité | React | Richesse fonctionnelle | Prise en main | Docs / exemples | Popularité / pérennité | Étoiles GitHub (≈) | Issues ouvertes (≈) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **BlockNote** (sur ProseMirror) | Élevée (composants intégrés, plugins opt-in) | Excellente (React-first, API simple) | Moyenne à bonne | **Très bonne** (rapide à configurer et utiliser) | Bonne (exemples très clairs) | Bonne et croissante | ~8.5k | ~200 |
| TipTap (sur ProseMirror) | Élevée | Bonne | Très élevée | Facile → Moyenne | Excellente | Très populaire | ~32k | ~710 |
| ProseMirror (low-level) | Très élevée | Indirect | Très élevée potentielle | Difficile | Bonne mais bas-niveau | Très mature, stable | ~8k | ~132 |
| Lexical | Élevée (plugins opt-in) | Excellente | Très bonne | Moyenne → Bonne | Très bonne | Bonne et en croissance | ~22k | ~500 |
| Slate | Élevée (plugins) | Très bonne | Bonne mais à assembler | Moyenne | Bonne | Communauté solide, rythme modéré | ~31k | ~670 |
| Plate (sur Slate) | Élevée (packs d’extensions) | Excellente | Élevée | Bonne | Très bonnes | Bonne | ~15k | ~10 |
| Quill | Moyenne | Bonne | Moyenne | Élevée | Bonnes | Mature et très répandu | Quill ~46k | Quill ~500 |

> Notes : Les chiffres GitHub sont indicatifs à la date de l’ADR.

## Alternatives évaluées (résumé)

### Lexical  

- Fort en modularité et en performances, mais nécessite une configuration plus avancée pour les fonctionnalités basiques.  
- Bonne documentation, mais une courbe d’apprentissage plus raide.

### Slate  

- Très flexible, mais nécessite beaucoup de travail pour assembler les fonctionnalités courantes.  
- Moins intuitif à configurer sans expertise avancée.

### Plate  

- Un super-ensemble de Slate avec des plugins pré-packagés, mais nécessite une surcharge d’implémentation.

### TipTap  

- Très riche en fonctionnalités, mais peut engendrer une charge de bundle importante.  
- Très populaire, mais nécessite plus de configuration pour les besoins simples.

### Quill  

- Très mature, mais plus lourd et moins modulaire dans sa conception.

### ProseMirror (low-level)  

- Très puissant, mais très bas niveau et peu ergonomique sans abstraction.

### BlockNote (choisi)  

- Moins riche en fonctionnalités avancées, mais **idéal pour les besoins fonctionnels standards**, avec une **facilité de configuration**.

## Conséquences

- Implémenter un composant `RichTextEditor` basé sur BlockNote dans `packages/ui`.
- Utiliser un format de stockage standardisé (HTML) pour éviter l'utilisation d'un format JSON spécifique à l'éditeur (malheureusement le Markdown ne semble pas permettre de stocker correctement le "souligné").
- Sécuriser l’entrée via des mécanismes de sanitization fournis par BlockNote.
- Mettre en place des tests d’intégration UI basiques (saisie, formats, undo/redo).

## Impacts techniques

- Ajout de dépendances `@blocknote/react`, `@blocknote/mantine` (ou d'autres variantes).
- Moins de configuration nécessaire : l’API React-native permet une utilisation rapide et simple.
- Création de hooks utilitaires si nécessaire pour uniformiser l’usage (ex : gestion de la valeur, sérialisation).
- Accessibilité : BlockNote intègre des comportements natifs et est conçu avec l’accessibilité en tête.

## Références

- BlockNote : [https://blocknote.dev](https://blocknote.dev)  
- BlockNote (GitHub) : https://github.com/TypeCellOS/BlockNote  
- Lexical : [https://lexical.dev](https://lexical.dev)  
- Slate : [https://docs.slatejs.org](https://docs.slatejs.org)  
- TipTap : [https://tiptap.dev](https://tiptap.dev)  
- Quill : https://quilljs.com  
- ProseMirror : [https://prosemirror.net](https://prosemirror.net)  
