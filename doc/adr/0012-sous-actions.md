# 11. Modélisation en BDD des sous-actions

**Date :** 2025-10-07  
**Statut :** Proposition

## Contexte

### Besoins 

Plusieurs besoins ont été consolidés:

- Faire évoluer les étapes des actions vers une notion de sous-action sur laquelle on peut définir un statut, des pilotes, une date d'échéance, des indicateurs associés.
  - En termes de profondeur, les sous-actions "infinies" n'ont pas été identifiées à ce jour mais c'est la manière dont fonctionne les outils de gestion de projet génériques (ex: linear). Il est donc légitime de se poser la question si on le prévoit dès le départ (ou tout du moins le laisse facilement possible en termes de modèle de données).
  - En revanche, une utilisatrice a déjà exprimé le faite qu'elle aimerait au moins deux niveaux. Elle a définit des actions relativement haut niveau pour que les élus puisse plus facilement les avoir en visibilité (mais c'est important pour elle que ce soit des vrais actions  et non des axes). Cela l'oblige à avoir deux niveaux de sous-actions ou à minima à pouvoir "grouper" les sous-actions. Ce besoin est cependant spécifique à une collectivité.
  
- Faire évoluer les axes afin de définir une description, des liens avec des indicateurs et éventuellement un budget.

### Problématiques techniques associées

D'un point de vue technique, il faut réfléchir à la traduction de ces besoins dans la modélisation courante (axe, action) et les impacts associés (court terme et moyen terme)

Les besoins exprimés donnent envie de modéliser des sous-actions comme des actions avec un parent. Cela laisse plus de flexibilité pour le futur, évite de réintroduire des nouvelles tables et des nouveaux endpoints etc. Mais la généricité peut quelque fois jouer des tours et complexifier le modèle de données donc il faut bien analyser les impacts associés.

Par ailleurs, comment est ce que se traduirait le besoin de grouper les sous action dans ce modèle de donnée ? Est ce que ça serait également une sous-action ? Faut il ne pas prendre en compte ce besoin de groupement trop spécifique ?

Plus largement, si on tire encore le fil, cela donne presque envie de convertir également les axes en des fiches actions vu qu'on vient y associer des indicateurs, y définir un budget etc. Si on suit cette logique, tout (axe, sous-action) devient une fiche action. Mais c'est dans ce cas un sacré chamboulement sur l'existant.

## Décision

### Sous-actions

Les sous-actions doivent être stockées en base comme une fiche action ayant un **unique** parent.
 Cela permet de bénéficier facilement de tout ce qui est mis en place techniquement(endpoint d'édition, recherche) voir même de l'interface d'édition (à confirmer car pas nécessairement le plus adéquat d'un point de vue UX dans un premier temps). 
 Et cela va également dans le sens de ce qu'on pressent au niveau des évolutions fonctionnelles à venir (documents associés à une sous-action, etc.).

 Des gardes-fou techniques devront être mis en place afin d'éviter de définir certains champs au niveau des sous-actions (ex: axes, fiches actions liées?) et d'interdire les "sous-action infinies".

 En ce qui concerne les groupes de sous-actions (lorsqu'on souhaite regrouper les sous-actions d'un même thème par exemple), ce besoin est apparu comme étant à la marge et donc non prioritaire. S'il fallait y répondre, le mécanisme de tag pourrait être réutilisé (éventuellement en limitant à un seul tag pour les sous-actions?).

### Axes

Les axes doivent restés des objets distincts. Il est important de bien cadrer ce qui peut être édité sur un axe: indicateur, budget pourquoi pas mais pas par exemple de statut, de document, note, etc afin de bien rester dans la philosophie d'un groupement qui vient aggréger des éléments pilotable mais n'est pas pilotable finement en lui même.

Entre autre une des différences notables entre un axe et une fiche action est la suivante: une fiche action peut être rattachée à différents axes de différents plans. En revanche, une sous-action ne peut pas être rattachée à différentes actions.
