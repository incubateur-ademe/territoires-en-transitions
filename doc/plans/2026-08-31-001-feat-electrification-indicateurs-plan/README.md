---
title: 'feat: Suivi des indicateurs Électrification'
type: feat
status: draft
date: 2026-08-31
updated: 2026-09-24
kind: index
notion: https://app.notion.com/p/accelerateur-transition-ecologique-ademe/lectrification-indicateurs-3c76523d57d78013aa2ae3785cf09f1f
---

# Suivi des indicateurs Électrification

Plan actualisé à partir du [cadrage Notion](https://app.notion.com/p/accelerateur-transition-ecologique-ademe/lectrification-indicateurs-3c76523d57d78013aa2ae3785cf09f1f),
notamment des ateliers des 8 et 10 septembre, relu le 24 septembre 2026.

**Le cadrage fait foi, actualisé par la dernière décision produit du 24 septembre : déclaration
fixe dès création, suppression des modes de périodicité et visualisation indépendante.**
Cette décision remplace les anciens parcours de conversion/suppression de déclaration.
Le plan décline ces règles en travaux ; le
prototype illustre les parcours et l'ADR décrit leur traduction technique. Leurs divergences
avec ces règles sont à corriger ; seuls les points non définis restent à préciser.

## Objectif et périmètre

Permettre aux lauréats de retrouver leurs indicateurs, de les lier à leurs actions et de les
suivre à une périodicité adaptée. Livrer aussi ces capacités aux autres collectivités.

Le cadrage mentionne **109 lauréats, 12 engagements et 4 axes**. Un engagement peut avoir
1 à 3 indicateurs de référence et plusieurs indicateurs de moyens/résultats locaux.
Ces nombres décrivent le programme actuel ; ils ne doivent pas être codés en dur.

Orientations retenues :

- importer progressivement les indicateurs validés métier par Émeline, dont les indicateurs
  macro des engagements ; ne pas attendre un catalogue complet et figé ;
- prendre en charge les quatre périodicités annuelle, semestrielle, trimestrielle et mensuelle
  pour les indicateurs prédéfinis et personnalisés : déclaration fixe dès création et visualisation
  agrégée indépendante, sans mode imposé/recommandé ni préférence locale de déclaration ;
- créer des vues filtrées enregistrées, avec un preset Électrification pour les lauréats ;
- créer par défaut un plan Électrification structuré selon les engagements et verrouillé,
  tout en laissant coexister d'autres plans librement organisés ;
- utiliser directement les objectifs des indicateurs, sans projeter les engagements chiffrés
  des candidatures ; inclure les deux « smart indicateurs » évoqués dans le cadrage après définition métier ;
- assurer la visibilité du programme avec son logo sur l'accueil : tâche marquée terminée dans Notion.

Le suivi mensuel est attendu par le SGPE. Son caractère obligatoire, ses contreparties et les
modalités de contrôle ne sont pas définis. Le reporting ADEME/État reste à cadrer.

## Lots et dépendances

| Lot                                                              | Contenu                                                                                                      | Dépendances restantes                                                          |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| [Phase 1 — Périodicités](phase-1-socle-mensuel.md)               | Déclaration fixe, retrait des modes/préférences, extension trimestrielle/semestrielle, visualisation agrégée | Reprise des préférences/historiques existants ; règles de visualisation        |
| [Phase 2 — Parcours Électrification](phase-2-electrification.md) | Import progressif, vues/preset, plan par défaut et verrouillage, liens avec les actions                      | Lots d'indicateurs validés, liste des lauréats, structure applicable et droits |
| [Phase 3 — Cadrage du reporting](phase-3-reporting.md)           | Besoins ADEME/SGPE/services déconcentrés, métriques et éventuel POC                                          | Interlocuteurs, règles métier, permissions, choix de surface                   |

La préparation du catalogue et les vues génériques peuvent avancer en parallèle de l'adaptation
du socle annuel/mensuel. Les parcours trimestriels et semestriels utilisent les contrats étendus
de la phase 1. Le retrait des anciennes préférences nécessite un traitement explicite des
historiques ; l'activation de la visualisation agrégée nécessite des règles de calcul validées.
Le parcours complet dépend des phases 1 et 2 ; le reporting ne bloque pas cette livraison.
Le [logo](https://app.notion.com/p/accelerateur-transition-ecologique-ademe/Logo-Electrifions-la-france-sur-la-page-Accueil-3d66523d57d78037a76bdab0badcc8d6)
est marqué terminé dans Notion ; le commentaire de livraison indique un déploiement de l'application
et du site le 21 septembre. Il n'est pas remis dans les travaux à réaliser.

## Périodicités : déclaration fixe et visualisation indépendante

Les quatre périodicités sont **annuelle, semestrielle, trimestrielle et mensuelle**.
Les périodicités trimestrielle et semestrielle étendent le socle annuel/mensuel existant.

| Notion                                       | Règle                                                                                        | Effet sur les valeurs                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Périodicité de déclaration**               | Fixée dans la définition à la création, commune à toutes les collectivités pour un prédéfini | Détermine la périodicité des valeurs déclarées ; non modifiable après création |
| **Périodicité de visualisation (affichage)** | Choix indépendant à la consultation : même périodicité que les sources ou plus large         | Agrégation à la lecture ; aucune modification des valeurs ni de la déclaration |

À la création d'un indicateur personnalisé, y compris depuis une action, la collectivité choisit
une des quatre périodicités ; le défaut reste annuel. Ce choix devient fixe dès la création,
même sans valeur enregistrée. Pour un prédéfini, il est fixé à la création dans le catalogue.
L'API, les imports du catalogue et la base garantissent cette immuabilité.

**Les modes imposé/recommandé, la préférence locale et les parcours de changement de déclaration
sont retirés du périmètre.** Les anciennes décisions de conversion vers une périodicité plus
large et de suppression vers une plus fine sont remplacées par cette règle.

La visualisation agrège selon la règle métier de l'indicateur. Pour un indicateur additionnable,
douze valeurs mensuelles de `10` donnent quatre trimestres de `30`, deux semestres de `60` ou
une année de `120`. Revenir au mensuel retrouve les douze valeurs intactes. Une valeur annuelle
ne permet pas de reconstituer des mois. Les données externes gardent leur propre périodicité ;
une visualisation ne mélange pas implicitement les séries.

La grille de déclaration édite les observations ; un agrégat de consultation ne devient pas
une nouvelle valeur enregistrée. Les exports conservent les valeurs enregistrées ; les
graphiques téléchargés reprennent la visualisation.

À préciser pour cette restitution : règles de calcul des stocks, pourcentages, objectifs et
données incomplètes ; présentation des sources, commentaires et références regroupés.
Les anciens arbitrages de destruction des données et de collisions de conversion deviennent
sans objet. La reprise des historiques existants reste un sujet de migration distinct,
détaillé dans l'[ADR 0018](../../adr/0018-periodicite-des-indicateurs.md).

## Modèle métier Électrification

S'appuyer sur les domaines existants `indicateurs` et `plans` :

- catalogue d'indicateurs avec provenance, version, unité, périodicité de déclaration et règles de calcul ;
- identification des lauréats et configuration nécessaire au preset et au plan par défaut ;
- modèle de plan avec identifiants stables et provenance des éléments provisionnés ;
- vues enregistrées et modèles de filtre réutilisables pour d'autres programmes.

Le rattachement automatique de tous les nouveaux indicateurs aux 12 engagements est **barré
dans Notion**. Ne pas le conserver comme exigence. Les associations utiles au plan doivent
être validées métier ; leur contenu ne se déduit ni d'un nom d'axe ni du formulaire de candidature.

La gestion complète des candidatures et de leurs évolutions n'est pas un prérequis acquis.
Définir la source des engagements applicables à chaque lauréat avant d'ajouter un modèle dédié.
Réutiliser `axe_indicateur` et `fiche_action_indicateur` pour les liens locaux ;
`indicateur_action` concerne les mesures des référentiels, pas les engagements Électrification.

## État du code et travaux nécessaires

Le socle annuel/mensuel est déjà implémenté sur la branche `split/23-schema-contract`
(commit `0dfc70231`). Il propose encore des modes, des préférences locales et des séries
coexistantes. La dernière décision nécessite son adaptation, sans reconstruire le modèle de valeurs.

| Existant                                                      | Travail nécessaire                                                                                                     |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Socle annuel/mensuel avec modes et préférences locales        | Retirer modes et préférences ; fixer la déclaration dès création ; étendre au trimestriel/semestriel                   |
| Préférences et séries historiques potentiellement divergentes | Inventorier et définir leur reprise avant retrait des champs, sans conversion, suppression ni perte d'accès implicites |
| Visualisation limitée au choix des graduations                | Implémenter l'agrégation à la lecture et les graphiques téléchargés correspondants                                     |
| Deux onglets fixes, filtres et favoris                        | Persister les vues, définir leur portée et provisionner le preset                                                      |
| Liens fiche/axe/indicateur                                    | Réutiliser les relations et adapter le sélecteur                                                                       |
| Création de plans et permissions ordinaires                   | Provisionnement idempotent, provenance et règles de verrouillage serveur                                               |
| API principalement mono-collectivité                          | Cadrer la lecture de reporting multi-collectivités en phase 3                                                          |

L'identité explicite des valeurs couvre périodicité, date et source : janvier, premier trimestre,
premier semestre et année peuvent commencer au `2026-01-01`. La visualisation reste un paramètre
de lecture distinct. PCAET, score indicatif et publication GES continuent de sélectionner les
valeurs annuelles et traitent leur absence, sans créer une série à partir d'un agrégat affiché.

Le prototype observé le 24 septembre doit être adapté : ajouter le semestriel, afficher la
déclaration fixe et proposer un choix de visualisation indépendant. Retirer les changements
de déclaration et leurs confirmations de conversion/suppression ; ne pas ajouter de choix de mode.

## Précisions encore ouvertes dans le cadrage

1. Règles de visualisation des stocks, pourcentages, objectifs et données incomplètes ; restitution des sources et métadonnées.
2. Reprise des préférences locales divergentes et séries historiques avant retrait des anciens champs.
3. Indicateurs prêts à importer, définition des deux smart indicateurs, périodicités fixes, sources et associations validées.
4. Identification des lauréats et source des engagements retenus ; qui les maintient ?
5. Propriété et partage des vues ; modification, suppression et restauration du preset.
6. Champs/opérations verrouillés, confidentialité du plan et rôle habilité à corriger sa structure.
7. Besoins de reporting, règles de complétude/progression et droits des acteurs.

## Hors périmètre ou non engagé

- gestion des groupements de collectivités : retirée du cadrage ;
- heatmap calendaire : proposition barrée ;
- projections automatiques depuis les engagements chiffrés des candidatures ;
- relances, échéances contractuelles et dépôt mensuel : questions ouvertes, pas des fonctionnalités validées ;
- reporting complet dans TeT ou Streamlit : surface non choisie ;
- preset Biodiversité : exemple d'extension future, pas une livraison de ce lot.

## Sources et validation métier

- [Grist Écolab](https://grist.numerique.gouv.fr/o/ecolabservicesdonnees/49SPrgL9jgVv/Referentiel-dindicateurs/p/48)
  et [Grist SGPE](https://grist.numerique.gouv.fr/o/100te/m4aC9Epwz7ot/Suivi-de-projet/p/20) :
  sources citées par le cadrage ; contenu à collecter et valider, pas un catalogue supposé stabilisé.
- [Prototype](https://tet-protos.vercel.app/#/indicateurs) : parcours à adapter à la déclaration fixe
  et à la visualisation indépendante.
- Annonce des lauréats le 11 septembre : embargo indiqué comme levé en principe. Coordonner
  les échanges avec les conventions État/collectivités ; privilégier les collectivités PAP
  actives ayant déjà exprimé le besoin de suivi mensuel.
