---
title: 'Phase 3 — Reporting ADEME'
parent: ./README.md
kind: phase
phase: 3
updated: 2026-09-24
---

# Phase 3 — Reporting ADEME

[← Index](README.md)

Le [Notion source](https://app.notion.com/p/accelerateur-transition-ecologique-ademe/lectrification-indicateurs-3c76523d57d78013aa2ae3785cf09f1f)
prévoit un suivi par l'ADEME, le SGPE et les services déconcentrés, aux niveaux territorial,
départemental, régional et national. **Le reporting n'est pas encore formalisé.** Streamlit
reste une piste ; aucune interface ni formule n'est arrêtée.

Cette phase commence par le cadrage. Elle **ne bloque pas la première livraison** : catalogue
progressif validé avec Émeline, suivi selon la périodicité, vues et plans Électrification verrouillés.
Les groupements et la heatmap sont retirés du périmètre du Notion.

## Task 3.1 — Cadrer les usages et les mesures

- préciser les décisions à prendre, les destinataires, leurs droits et les restitutions attendues ;
- coordonner les entretiens avec les conventions et les contacts existants ; l'annonce du
  11 septembre marque une levée d'embargo indiquée comme acquise en principe, à confirmer
  avec ces interlocuteurs ; privilégier les
  collectivités actives dans les PAP ayant déjà exprimé des besoins ;
- décider de la surface : POC Streamlit, vue TeT, ou autre restitution ;
- valider les formules et les données nécessaires avant de lancer la réalisation.

Pistes de mesure du succès, **à valider** : nombre et part des lauréats avec un plan, au moins
une action par engagement, déclaration d'indicateurs commencée, tous les indicateurs manuels à jour
à M-2 ; nombre de collectivités utilisant des indicateurs personnalisés non annuels ; besoins
d'accompagnement et d'évolution remontés. **M-2 est un seuil de fraîcheur proposé**, pas une
échéance universelle de déclaration.

## Task 3.2 — Définir le contrat de reporting

**Complétude** (formule candidate) :

```text
nombre d'échéances de déclaration attendues et renseignées / nombre d'échéances de déclaration attendues et applicables
```

La périodicité de déclaration est fixée à la création de chaque indicateur : annuelle,
semestrielle, trimestrielle ou mensuelle. À définir pour le reporting : première date à renseigner,
échéances closes, délai de grâce,
`resultat` seul ou objectif aussi, sources admises, indicateur inactif et applicabilité en cours
de campagne. Les échéances attendues sont fixées pour le reporting ; elles ne dépendent pas
de la périodicité de visualisation (affichage), qui ne change pas la déclaration.
La date de début associée à une valeur et la date limite de déclaration sont distinctes.
La complétude se calcule sur les déclarations attendues et les observations enregistrées, jamais
sur le nombre de points affichés. Une projection annuelle de données mensuelles ne remplit
pas d'échéance supplémentaire et ne change ni leur fraîcheur ni les échéances renseignées.
La visualisation utilise la périodicité des valeurs ou une périodicité plus large ; revenir
au détail retrouve les observations d’origine. Les sources externes gardent leur périodicité.
La reprise des données existantes préserve l’historique : une migration technique ne vaut pas
nouvelle déclaration et sa date ne suffit pas à attester la fraîcheur des données. Préciser le
calcul de fraîcheur et la contribution des sources admises. Absence = `null`, `0` = renseigné.

**Progression** : les agrégats sont des restitutions calculées à la lecture, sans modifier
les observations ni leur périodicité de déclaration. Pas de formule générique définie dans le cadrage.
Pistes à valider selon l'indicateur : somme de flux / dernière valeur
de stock / ratio num-dénom / moyenne pondérée / jalon / aucune. Une fois validée, la règle est
portée par le catalogue et testée par indicateur. **Jamais** de somme ou moyenne générique de pourcentages.
Utiliser les objectifs des indicateurs ; ne pas les déduire des engagements des candidatures.
Préciser leur horizon et leur articulation avec la périodicité et les dates des observations.

Décider si le reporting montre l'état courant ou un état historisé à une date de revue.

## Task 3.3 — Réalisation conditionnelle

**À engager après validation du cadrage**, avec catalogue et valeurs datées par périodicité disponibles :

- requêtes multi-collectivités côté serveur ; filtres engagement, indicateur, périodicité de
  déclaration, plage de dates, département et région, selon les usages retenus ; distinguer
  ces filtres de la périodicité de visualisation demandée ;
- agrégats calculés à la lecture selon les règles validées, sans les enregistrer comme
  observations des collectivités ; les exports de valeurs reprennent les observations
  enregistrées avec leur périodicité, date et source ; les téléchargements de graphiques
  reprennent l’affichage. Tout autre export de restitution reste à valider dans le cadrage ;
  s’il est retenu, identifier les agrégats et leur périodicité, sans inventer d’observations plus fines ;
- vérifier qu'un changement de visualisation ne modifie ni les valeurs sources, ni la périodicité
  de déclaration, ni la complétude ou la fraîcheur ; couvrir les quatre périodicités et le retour
  au détail ; aucune fraîcheur ne doit être déduite de la seule date d’une migration technique ;
- permissions dédiées par rôle et périmètre, tests de cloisonnement et de confidentialité ;
- si Streamlit est retenu : extraction serveur authentifiée, colonnes et collectivités
  filtrées par permission, sans accès direct à la base ;
- validation avec les acteurs concernés et les lauréats, puis décision de généralisation.
