---
title: 'Phase 2 — Catalogue et config Électrification'
parent: ./README.md
kind: phase
phase: 2
updated: 2026-09-24
---

# Phase 2 — Catalogue et configuration Électrification

[← Index](README.md)

Source : [Notion Électrification / indicateurs](https://app.notion.com/p/accelerateur-transition-ecologique-ademe/lectrification-indicateurs-3c76523d57d78013aa2ae3785cf09f1f),
dont le cadrage du 10/09 : PA Électrification par défaut, aligné sur les engagements et verrouillé,
en coexistence avec les autres plans locaux ; vue Électrification préconfigurée pour les lauréats.

Le programme concerne **109 lauréats, 12 engagements et 4 axes**. Chaque engagement s'appuie sur
1 à 3 indicateurs de référence, complétés par des indicateurs locaux de moyens ou de résultats.
Le catalogue sera importé progressivement après validation par Émeline, sans attendre sa clôture.
Le contrat des engagements personnalisés reste à préciser ; il ne bloque pas tout le programme.

**Dépendances** : réutiliser le socle annuel/mensuel implémenté sur `split/23-schema-contract` ;
la phase 1 porte ses extensions et le contrat déclaration/visualisation de l’[ADR 0018](../../adr/0018-periodicite-des-indicateurs.md).
Catalogue progressif, vues génériques et sélecteur peuvent avancer avant la fin de ces extensions
et du cadrage des engagements personnalisés. Le provisionnement nécessite la liste des lauréats
et le mapping du modèle validés. Le cadrage du reporting en phase 3 ne bloque pas cette phase.
La reprise des anciennes préférences locales relève de la phase 1, après inventaire et traitement
métier des divergences, sans conversion ni suppression automatique de l’historique.

Emplacements : `packages/domain/src/indicateurs/`, `apps/backend/src/indicateurs/`,
changements `data_layer/sqitch/`. Isoler le catalogue Électrification dans `electrification/` ;
garder les vues génériques dans le domaine `indicateurs`. Composer les sous-routers dans
`indicateurs.router.ts` et les modules dans `IndicateursModule`.

## Task 2.1 — Catalogue progressif et import sécurisé

- Versionner axes, engagements, indicateurs et associations, avec identifiants stables et provenance.
- Recenser les données des Grist Ecolab et SGPE ; désigner la source faisant foi pour chaque champ.
- Importer les indicateurs validés par Émeline : définition, unité, périodicité de déclaration
  fixée à la création et association. Couvrir les quatre périodicités : annuelle, semestrielle,
  trimestrielle et mensuelle. Les sources externes conservent leur propre périodicité, sans changer
  celle de déclaration de l’indicateur. La périodicité de visualisation (affichage) est indépendante.
  Inclure les indicateurs macro liés aux 12 engagements et les deux « smart indicateurs »,
  dont les définitions restent à valider ; ne pas inventer leur calcul ou leur correspondance avec les engagements.
- Refuser toute modification de la périodicité de déclaration après création, même sans valeur :
  une mise à jour ou un réimport du catalogue ne la change pas. Cette règle vaut pour tous les
  indicateurs ; à la création d’un indicateur personnalisé, la collectivité choisit une des quatre
  périodicités, qui reste ensuite fixe. Préserver l’homogénéité des formules et dépendances.
- Import authentifié ou job, idempotent, avec lot, checksum et compte-rendu des rejets.
  Ne pas réutiliser le contrôleur anonyme `GET` pour les candidatures confidentielles.
- Valider chaque mapping engagement–indicateur : l'ancien rattachement automatique de tous les
  nouveaux indicateurs prédéfinis aux 12 engagements est barré dans la source et n'est pas retenu.
- Ajouter migrations deploy/revert/verify et contrôles d'intégrité ; un lot incomplet ne doit pas
  effacer les définitions, associations ou valeurs déjà validées.

## Task 2.2 — Affectation aux lauréats et objectifs

- Définir comment identifier un lauréat et connaître ses engagements retenus ; valider le mapping
  du modèle de PA avant toute affectation, sans déduire les engagements à partir des noms d'axes.
- Préciser le repère d'appartenance au programme évoqué dans le cadrage (lauréat et année) ;
  son affichage reste à définir.
- Clarifier la source et le périmètre des engagements personnalisés. Stocker dans TeT uniquement
  les données nécessaires au parcours retenu, avec provenance et règles d'accès explicites.
- Les objectifs sont déclarés directement sur les indicateurs ; aucune projection automatique des
  engagements vers les objectifs d'indicateurs n'est prévue.
- Si TeT administre cette configuration : permission plateforme dédiée, contrôles serveur,
  confidentialité des candidatures ; pas de droit implicite pour tout super-admin.
- Services au format `Result`, permissions et transactions dans les services, erreurs tRPC
  à la frontière ; accès aux données privées limité aux rôles autorisés.

## Task 2.3 — PA Électrification par défaut et protection

Complément : [PA verrouillé pour les lauréats](https://app.notion.com/p/accelerateur-transition-ecologique-ademe/PA-verrouill-pour-les-Laur-ats-3e46523d57d7808e89fae5b4685c0bb6).

- Provisionner un PA dédié conforme aux engagements retenus et au modèle validé ; conserver les
  autres plans et actions locaux. Ce PA n'est plus une option « aucun / manuel / provisionné ».
- Orchestrateur `create-electrification-plan` composant les services plan et axe via `PlanModule`
  et `TransactionManager`, sans accès direct aux repositories de `plans` ; création transactionnelle
  et idempotente, unicité campagne–participant, conservation des IDs lors des reprises.
- Garder le mapping engagement–indicateur indépendant des axes. Réutiliser `axe_indicateur`
  et `fiche_action_indicateur` pour les liens locaux, pas `indicateur_action` des référentiels.
- Tracer l'origine des éléments provisionnés. Une synchronisation préserve liens manuels et déclarations
  locales ; `UpsertAxeRepository.setAxeIndicateurs` remplace tout et ne convient pas à une reprise
  sans cette protection. La synchronisation conserve la périodicité de déclaration fixée
  à la création et les données historiques ; elle ne transforme pas les valeurs enregistrées.
- Faire respecter le verrouillage côté serveur dans les chemins plan, axe, fiche et indicateur,
  y compris modification des liens depuis l'indicateur, suppression et déplacement.
- Arbitrer les champs protégés et ceux restant éditables, les droits de correction, la confidentialité
  et le cas d'une fiche liée à plusieurs plans ; permettre le suivi territorial selon ces règles.
  Afficher la protection et sa raison dans l'interface ; préciser comment réduire la place des
  indicateurs dans la vue plan, comme demandé lors de l'atelier du 10 septembre.

## Task 2.4 — Vues enregistrées et preset Électrification

Source : [vues personnalisées](https://app.notion.com/p/accelerateur-transition-ecologique-ademe/Vues-personnalis-es-indicateurs-3d76523d57d780c08d79d7689670cda1).

- Créer une vue depuis le panneau de filtres, la nommer, la retrouver dans un onglet et la supprimer ;
  persister ses filtres. Le renommage proposé est disponible quand les filtres correspondent
  exactement à une vue existante.
- Si une vue conserve un réglage de visualisation, préciser sa portée (commune ou par indicateur)
  et sa persistance. Il permet de visualiser les valeurs à leur périodicité ou à une périodicité
  plus large, selon l’ADR. Le distinguer des filtres et de la périodicité de déclaration fixe ;
  ouvrir ou modifier une vue ne modifie aucune valeur enregistrée.
- Dans ce panneau, remplacer Catégorie par Modèle, retirer le filtre Open Data, ajouter la
  réinitialisation et le nombre de correspondances ; partager la taxonomie avec le sélecteur d'indicateurs.
- Fournir une vue Électrification par défaut aux lauréats à partir du catalogue applicable ;
  prévoir les états catalogue incomplet, aucun engagement affecté et aucune valeur enregistrée
  à la date consultée selon la périodicité de déclaration. Un agrégat affiché
  ne crée pas d’observation ; les échéances et le retard de reporting restent à cadrer en phase 3.
- Définir la propriété des vues (personnelle ou collective), leurs droits d'édition/suppression,
  l'ordre, et le comportement du preset lors d'une mise à jour du catalogue.
- Garder le mécanisme réutilisable pour de futurs presets, dont Biodiv ; livrer ici Électrification.
- Réutiliser `IndicateurCard`, filtres et déclaration de la phase 1 ; prévoir l'accès depuis le PA.

## Task 2.5 — Sélecteur « lier un indicateur à une action »

Source : [proposition Notion](https://app.notion.com/p/accelerateur-transition-ecologique-ademe/Lier-un-indicateur-une-action-3e46523d57d78070b14de1ddb3e4f67e).

- Dans `link-indicateur.view.tsx`, conserver recherche, thématique, personnalisés et favoris.
- Ajouter « Modèle » ; définir la taxonomie ADEME / Électrification et son lien au catalogue.
  Le filtre existant `categorieNoms` et `IndicateurCategoriesDropdown` fournissent une base.
- Retirer la case « Indicateurs clés », inclus dans le modèle ADEME ; renommer « Mes indicateurs »
  en « Indicateurs que je pilote » et retirer son icône d'information. Garder le filtre par pilote.
- Réutiliser les associations existantes ; le nouveau filtre ne doit pas modifier la sélection
  ni permettre de délier un indicateur protégé par le PA.

## Critères d'acceptation

- Réimport d'un lot sans doublon ni perte ; validation des unités, des quatre périodicités et
  mappings ; modification de la périodicité de déclaration refusée, même avant la première valeur ;
  sources externes et historique préservés ; catalogue partiel utilisable et indicateurs non validés non publiés.
- Reprise du provisionnement sans second PA ; rollback en cas d'échec ; IDs et données locales
  conservés ; aucun rattachement général automatique aux 12 engagements.
- Verrouillage testé par les API plan, axe, fiche et indicateur, avec rôles autorisés/interdits,
  champs éditables et fiche présente dans plusieurs plans ; confidentialité vérifiée.
- Vues retrouvées après reconnexion, droits respectés, preset disponible pour les seuls lauréats
  prévus ; filtres du sélecteur combinables et sélection conservée ; ouverture d’une vue et
  affichage agrégé sans modification des valeurs enregistrées ni de la périodicité de déclaration.
- Hors lot : groupements et heatmap, barrés dans la source ; aucun calcul d'objectif depuis les
  engagements, ni livraison d'un preset Biodiv.
