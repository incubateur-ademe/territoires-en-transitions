# 15. Génération de rapports au format PPTX

**Date :** 2025-12-23  
**Statut :** Proposition

## Besoins

Les utilisateurs des collectivités expriment depuis longtemps le besoin de générer automatiquement des rapports pour les aider dans la préparation de bilans annuels par exemple. Nous nous sommes orientés vers la génération automatique de PPTX permettant à l'utilisateur de compléter / amender la présentation générée.

De manière générale, une solution basée sur un template est preferrable à une solution de génération "from scratch" car elle permet de changer facilement l'apparence sans devoir faire appel à un développeur.

L'ensemble des besoins de génération (mise en forme, tableau, graphiques, liens) ont été listés dans [cette epic notion](https://www.notion.so/accelerateur-transition-ecologique-ademe/Recherche-technique-bilan-2a16523d57d780679444c0f566e17456).

## Solution retenue pptx-automizer

La solution retenue [pptx-automizer](https://github.com/singerla/pptx-automizer).

Avantages :

- Faite pour répondre au besoin de générer des présentations à partir de fichiers templates
- Prise en main facile
- Basée sur [PptxGenJS](https://github.com/gitbrent/PptxGenJS), et permet de créer des éléments à partir de zéro en utilisant directement PptxGenJS.

Inconvénients :

- La communauté n'est pas si grande (contributeurs, utilisateurs)
- Nécessite l'écriture des fichiers (média, présentation) sur un filesystème

Le détail de l'analyse technique par rapport aux besoins d'édition est présenté dans [cette epic notion](https://www.notion.so/accelerateur-transition-ecologique-ademe/Recherche-technique-bilan-2a16523d57d780679444c0f566e17456)

## Alternative considérées

### Utilisation de l'api Google Slides

Avantages :

- API Google bien maintenue.
- L'édition se fait par Api, pas de nécessité d'un filesystem et moins de problème potentiels de mémoire.
- Possibilité d'export au format PDF
- Déjà utilisé par une partie de l'équipe.

Inconvénients :

- Adhérence supplémentaire au cloud Google (outil externe, souveraineté)
- Confidentialité des données dans le cloud Google

### Utilisation de PptxGenJS

[PptxGenJS](https://github.com/gitbrent/PptxGenJS) est la librairie qui semble la plus populaire pour la génération de pptx avec NodeJS. En revanche

Avantages :

- Librairie populaire, bien maintenue

Inconvénients :

- Pas de système de template, nécessite de créer la présentation en code à partir de zéro.
