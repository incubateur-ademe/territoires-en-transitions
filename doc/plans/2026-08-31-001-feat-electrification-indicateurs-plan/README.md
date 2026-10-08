---
title: 'feat: Suivi des indicateurs Électrification'
type: feat
status: draft
date: 2026-08-31
updated: 2026-10-08
kind: index
notion: https://app.notion.com/p/accelerateur-transition-ecologique-ademe/lectrification-indicateurs-3c76523d57d78013aa2ae3785cf09f1f
---

# Suivi des indicateurs Électrification

Plan actualisé à partir du [cadrage Notion](https://app.notion.com/p/accelerateur-transition-ecologique-ademe/lectrification-indicateurs-3c76523d57d78013aa2ae3785cf09f1f),
notamment des ateliers des 8 et 10 septembre, relu le 24 septembre 2026.

**La décision produit du 24 septembre 2026 impose une périodicité unique pour la déclaration
et la visualisation, sans agrégation ni mode forcé/recommandé. La collectivité choisit la
périodicité à la création d'un indicateur personnalisé ; elle n'est plus modifiable ensuite.**
Le plan est corrigé le 8 octobre 2026 pour restituer cette décision. Elle remplace les anciens
parcours de conversion/suppression de déclaration et le choix d'une visualisation indépendante.
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
  pour les indicateurs prédéfinis et personnalisés : périodicité fixe dès création, commune à la
  déclaration et à la visualisation, sans agrégation, mode forcé/recommandé ni préférence locale ;
- créer des vues filtrées enregistrées, avec un preset Électrification pour les lauréats ;
- créer par défaut un plan Électrification structuré selon les engagements et verrouillé,
  tout en laissant coexister d'autres plans librement organisés ;
- utiliser directement les objectifs des indicateurs, sans projeter les engagements chiffrés
  des candidatures ; inclure les deux « smart indicateurs » évoqués dans le cadrage après définition métier ;
- assurer la visibilité du programme avec son logo sur l'accueil : tâche marquée terminée dans Notion.

Le suivi mensuel est attendu par le SGPE. Son caractère obligatoire, ses contreparties et les
modalités de contrôle ne sont pas définis. Le reporting ADEME/État reste à cadrer.

## Lots et dépendances

| Lot                                                                                    | Contenu                                                                                                                                   | Dépendances restantes                                                          |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [Phase 1 — Périodicités](phase-1-periodicites-des-indicateurs.md)                      | Périodicité fixe de déclaration et de visualisation, retrait des modes/préférences, extension trimestrielle/semestrielle, sans agrégation | Reprise des préférences et historiques existants                               |
| [Phase 2 — Parcours Électrification](phase-2-catalogue-et-parcours-electrification.md) | Import progressif, vues/preset, plan par défaut et verrouillage, liens avec les actions                                                   | Lots d'indicateurs validés, liste des lauréats, structure applicable et droits |
| [Phase 3 — Cadrage du reporting](phase-3-cadrage-reporting.md)                         | Besoins ADEME/SGPE/services déconcentrés, métriques et éventuel POC                                                                       | Interlocuteurs, règles métier, permissions, choix de surface                   |

La préparation du catalogue et les vues génériques peuvent avancer en parallèle de l'adaptation
du socle annuel/mensuel. Les parcours trimestriels et semestriels utilisent les contrats étendus
de la phase 1. Le retrait des anciennes préférences nécessite un traitement explicite des
historiques. Aucune règle d'agrégation de restitution n'est à définir pour cette livraison.
Le parcours complet dépend des phases 1 et 2 ; le reporting ne bloque pas cette livraison.
Le [logo](https://app.notion.com/p/accelerateur-transition-ecologique-ademe/Logo-Electrifions-la-france-sur-la-page-Accueil-3d66523d57d78037a76bdab0badcc8d6)
est marqué terminé dans Notion ; le commentaire de livraison indique un déploiement de l'application
et du site le 21 septembre. Il n'est pas remis dans les travaux à réaliser.

## Périodicité fixe, commune à la déclaration et à la visualisation

Les quatre périodicités sont **annuelle, semestrielle, trimestrielle et mensuelle**.
Les périodicités trimestrielle et semestrielle étendent le socle annuel/mensuel existant.

| Notion                                       | Règle                                                                                        | Effet sur les valeurs                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Périodicité de déclaration**               | Fixée dans la définition à la création, commune à toutes les collectivités pour un prédéfini | Détermine la périodicité des valeurs déclarées ; non modifiable après création |
| **Périodicité de visualisation (affichage)** | Identique à la périodicité de déclaration, sans réglage indépendant                          | Affichage des observations à leur périodicité, sans agrégation                 |

À la création d'un indicateur personnalisé, y compris depuis une action, la collectivité choisit
une des quatre périodicités ; le défaut reste annuel. Ce choix devient fixe dès la création,
même sans valeur enregistrée. Pour un prédéfini, il est fixé à la création dans le catalogue.
L'API, les imports du catalogue et la base garantissent cette immuabilité.

**Les modes forcé/recommandé, les préférences locales de périodicité, les parcours de changement
de déclaration et le choix d'une périodicité de visualisation indépendante sont supprimés.**
Les anciennes décisions de conversion vers une périodicité plus large et de suppression vers
une plus fine sont remplacées par cette règle.

Douze valeurs mensuelles de `10` restent douze points mensuels de `10`, même lorsque la plage
consultée couvre une année. Aucun regroupement trimestriel, semestriel ou annuel n'est calculé.
Aucune valeur plus fine n'est reconstituée depuis une valeur annuelle, semestrielle ou trimestrielle.

La grille de déclaration, le tableau, les graphiques et leurs téléchargements utilisent la même
périodicité. Les exports conservent les observations enregistrées, leurs dates et leurs sources.
Les résultats, objectifs, commentaires et références restent attachés aux observations.

Les données externes et historiques gardent leur périodicité d'origine. Leur reprise et leur accès
restent à préciser dans la migration lorsque cette périodicité diffère de celle de la définition,
sans conversion, suppression implicite ni réglage d'affichage indépendant. L'[ADR 0018](../../adr/0018-periodicite-des-indicateurs.md)
précise les invariants à préserver.

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

| Existant                                                      | Travail nécessaire                                                                                                                               |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Socle annuel/mensuel avec modes et préférences locales        | Retirer modes et préférences ; fixer une périodicité commune de déclaration et de visualisation dès création ; étendre au trimestriel/semestriel |
| Préférences et séries historiques potentiellement divergentes | Inventorier et définir leur reprise avant retrait des champs, sans conversion, suppression ni perte d'accès implicites                           |
| Visualisation limitée au choix des graduations                | Aligner l'affichage et les graphiques téléchargés sur la périodicité de déclaration, sans agrégation ni sélecteur indépendant                    |
| Deux onglets fixes, filtres et favoris                        | Persister les vues, définir leur portée et provisionner le preset                                                                                |
| Liens fiche/axe/indicateur                                    | Réutiliser les relations et adapter le sélecteur                                                                                                 |
| Création de plans et permissions ordinaires                   | Provisionnement idempotent, provenance et règles de verrouillage serveur                                                                         |
| API principalement mono-collectivité                          | Cadrer la lecture de reporting multi-collectivités en phase 3                                                                                    |

L'identité explicite des valeurs couvre périodicité, date et source : janvier, premier trimestre,
premier semestre et année peuvent commencer au `2026-01-01`. La visualisation utilise la même
périodicité que la déclaration. PCAET, score indicatif et publication GES continuent de sélectionner
les valeurs annuelles et traitent leur absence, sans les fabriquer depuis une autre périodicité.

Le prototype observé le 24 septembre doit être adapté : proposer les quatre périodicités à la
création personnalisée puis afficher la périodicité fixe pour la déclaration et la visualisation.
Retirer les sélecteurs de périodicité après création, les modes forcé/recommandé et les confirmations
de conversion/suppression.

## Précisions encore ouvertes dans le cadrage

1. Accès aux sources externes et historiques dont la périodicité diffère de celle de la définition, sans conversion ni perte d'accès implicite.
2. Reprise des préférences locales divergentes et séries historiques avant retrait des anciens champs.
3. Indicateurs prêts à importer, définition des deux smart indicateurs, périodicités fixes, sources et associations validées.
4. Identification des lauréats et source des engagements retenus ; qui les maintient ?
5. Propriété et partage des vues ; modification, suppression et restauration du preset.
6. Champs/opérations verrouillés, confidentialité du plan et rôle habilité à corriger sa structure.
7. Besoins de reporting, règles de complétude/progression et droits des acteurs.

## Hors périmètre ou non engagé

- agrégations entre périodes et choix d'une périodicité de visualisation indépendante ;
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
- [Prototype](https://tet-protos.vercel.app/#/indicateurs) : parcours à adapter à une périodicité fixe
  commune à la déclaration et à la visualisation, choisie à la création personnalisée.
- Annonce des lauréats le 11 septembre : embargo indiqué comme levé en principe. Coordonner
  les échanges avec les conventions État/collectivités ; privilégier les collectivités PAP
  actives ayant déjà exprimé le besoin de suivi mensuel.
