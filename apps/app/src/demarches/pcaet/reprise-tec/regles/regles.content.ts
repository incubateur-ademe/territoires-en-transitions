export const reglesDeLaReprise = `## 1. Les dossiers

**1 779 dossiers dans T&C → 1 006 dossiers PCAET dans TeT.**

### Ce qui n'arrive pas (773)

| Dans T&C | Nombre | Pourquoi |
|---|---:|---|
| La copie « définitif » d'un dossier déposé | 463 | ce n'est pas un dossier de plus : son contenu rejoint le dossier « mise en œuvre » |
| Dossier vide (ni fichier, ni diagnostic, ni action, ni vulnérabilité) | 285 | rien à reprendre |
| Dossier sans état, jamais visible sur la vitrine | 10 | jamais utilisé |
| Dossier en élaboration en doublon d'un PCAET déjà adopté | 13 | le PCAET adopté arrive déjà ; ex. Grenoble-Alpes-Métropole |
| Deuxième dossier en élaboration d'une même collectivité | 1 | on garde le plus récent ; CC Bièvre Isère |
| Dossier de test | 1 | « TEST », CA de Sophia Antipolis |

### Où arrivent les autres

| État dans T&C | Ce qu'en dit le suivi ADEME | Statut dans TeT | Nombre |
|---|---|---|---:|
| Mise en œuvre (dossier déposé et définitif) | | **Publié** | 463 |
| Sans état, visible sur la vitrine | | **Publié** | 339 |
| Dépôt pour avis | approuvé | **Publié** | 91 |
| En cours d'élaboration | approuvé après le lancement du dossier | **Publié** | 32 |
| Dépôt pour avis | pas approuvé, ou approbation trop ancienne (un PCAET précédent) | **Instruit** | 47 |
| En cours d'élaboration | pas approuvé | **En élaboration** | 34 |

Dans TeT :

- **Publié** veut dire adopté, en vigueur ;
- **Instruit** veut dire que les avis ont été rendus, et que la collectivité doit encore déposer sa délibération d'adoption et publier ;
- **En élaboration** veut dire que la collectivité remplit son dossier, puis le transmet pour avis.

Comment sait-on qu'une collectivité n'a pas encore déposé sa délibération
d'adoption ? T&C n'a pas de champ qui le dise : on le déduit de deux sources.

- **Dans T&C**, le dossier est resté en « dépôt pour avis » : la collectivité
  n'est pas passée au dépôt définitif, l'étape où elle dépose le PCAET adopté
  et sa délibération, et qui met le dossier en « mise en œuvre ».
- **Dans le suivi ADEME**, aucune approbation récente : pas de date
  d'approbation, ou une date de plus de 2 ans avant la transmission pour avis
  (c'est alors celle du PCAET précédent).

Si le suivi ADEME donne une approbation récente, le dossier arrive
**Publié**, même resté en « dépôt pour avis » dans T&C (91 dossiers).
« Instruit » veut donc dire, au sens strict : aucune adoption connue, ni dans
T&C, ni dans le suivi ADEME (47 dossiers). Deux limites : une collectivité a
pu adopter son PCAET sans faire le dépôt définitif dans T&C, et le suivi
ADEME peut ne pas avoir encore noté une adoption récente. « Les avis ont été
rendus » est aussi une déduction : toutes les consultations sont tenues pour
closes.

**Aucun dossier n'arrive « transmis pour avis »** : toutes les consultations sont closes.

| Aussi | Règle |
|---|---|
| La collectivité | retrouvée par son SIREN ; 8 structures qui ont changé de SIREN (syndicat devenu PETR…) sont rattachées à leur nouveau SIREN ; 4 sont à créer avant l'import (Pays de Sources et Vallées, Aulan, Ouessant, Syndicat mixte du Cotentin) |
| Le titre | le nom du dossier dans T&C |
| La description courte | reprise, mais affichée nulle part dans TeT |
| « Modifié le » | le jour de l'import |
| Auteur, historique des statuts | aucun |

> Exemple : CA Pays de Montbéliard. Dans T&C, son dossier est « en cours
> d'élaboration » (lancé le 14/11/2024). Le suivi ADEME dit approuvé le
> 26/06/2025. Il arrive **Publié**, adopté le 26/06/2025.

## 2. Les dates

| Dans TeT | D'où elle vient |
|---|---|
| Lancement | la date de lancement saisie dans T&C |
| Transmission pour avis | la réception du projet ; à défaut, la première date d'avis de T&C. Jamais après l'avis de l'État du suivi. |
| Échéance des avis | la transmission plus 4 mois |
| Adoption et publication | la date d'approbation du suivi ADEME ; à défaut, la date de dépôt définitif ou de dernière mise à jour dans T&C |
| Une date saisie « 0023 » | lue 2023 ; une date impossible est ignorée |

## 3. Obligatoire ou volontaire

Dans l'ordre : ce que dit le dossier T&C ; sinon le suivi ADEME ; sinon le seuil
de 20 000 habitants pour une intercommunalité ; sinon volontaire.

## 4. Les services qui instruisent

Chaque dossier transmis est envoyé, comme une transmission dans TeT, à **chaque
service qui couvre la collectivité** : DREAL, Région, DDT, DR ADEME, services
nationaux. Ils le voient dans leur liste à la date de transmission.

- Le service du territoire de la collectivité est saisi en principal ; un
  service voisin, dont le périmètre déborde, la reçoit « en lecture ».
- L'outre-mer, Paris et la petite couronne n'ont pas de DDT.
- Un dossier en élaboration n'est envoyé à personne.

## 5. Les documents

| Dans T&C | Dans TeT |
|---|---|
| Rubrique « dépôt pour avis » | les documents du projet transmis |
| Rubrique « dépôt définitif » | les documents du PCAET adopté |
| Autre rubrique | documents additionnels |
| Un PDF dont le nom dit la pièce (« diagnostic », « stratégie », « EES »…) | rangé dans la bonne case du dossier |
| Une délibération | la case que dit son nom (engagement, arrêt, adoption) ; ex. PETR de l'Alsace du Nord, « Adoption du PCAET » |
| Le même fichier déposé deux fois | un seul exemplaire |
| Un fichier introuvable dans l'archive de T&C | visible, mais sans téléchargement (64 cas) |
| Un fichier qui n'est pas un PDF (zip, tableur, image) | documents additionnels : une case n'accepte que des PDF |
| Deux fichiers pour la même case | le premier déposé va dans la case, l'autre en documents additionnels |
| Un fichier unique nommé « PCAET » | le PCAET complet ; il coche les pièces qu'il contient |
| Un fichier que la collectivité avait déjà mis dans TeT | réutilisé, pas en double (480 cas) |
| La date d'une pièce | la transmission (dépôt pour avis), la publication (dépôt définitif), sinon le jour de l'import |

## 6. Les avis

| Dans T&C | Dans TeT |
|---|---|
| « Avis DREAL », « Avis CR » d'un dossier transmis | l'avis du préfet de région ou du président de région, avec son PDF |
| Plusieurs PDF | le courrier signé, plutôt qu'une annexe |
| Un avis sans PDF, ou sans courrier | non repris comme avis ; ses fichiers restent au dossier |
| La date de l'avis | le suivi ADEME s'il tombe dans l'année qui suit la transmission ; sinon une date écrite dans le nom du fichier ; sinon la date de T&C |
| Où est rangé le PDF | chez le service qui a rendu l'avis, confidentiel ; la collectivité le lit dans « Avis reçus » |

**448 avis** repris.

## 7. Les actions

| Dans T&C | Dans TeT |
|---|---|
| Une action | une fiche, dans un plan « PCAET <année de lancement> (repris de Territoires & Climat) » rattaché au dossier |
| Statut de l'action | « À venir » partout (T&C n'en avait pas) |
| Secteur réglementaire (Résidentiel, Tertiaire, Transport routier, Autres transports, Agriculture, Déchets, Industrie) | le champ « secteurs » de la fiche, comme saisi par la collectivité (7 653 fiches) |
| Autre secteur (Biodiversité, Eau, Tourisme, Santé, Forêt…) | une thématique, et une sous-thématique quand elle dit la même chose |
| Fiche sans secteur réglementaire | son champ « secteurs » est proposé ensuite par l'outil de remplissage automatique |
| Volet du PCAET | un effet attendu |
| Porteur, type d'action | une structure pilote, une étiquette |
| Commentaire | une note de suivi |
| Fichier, site web | une pièce jointe de la fiche, « par Territoires & Climat » ; le lien porte le nom du site |
| Intitulé, description | titre, description |
| Date de lancement | date de début |
| Cibles (7 dans T&C) | cibles de TeT (13) |
| Secteur libre (texte) | une étiquette |
| Population couverte, fiche associée | non reprises : pas de place dans une fiche |

**18 526 fiches**, dans 610 plans. La collectivité qui avait déjà un plan dans
TeT le garde : le plan repris s'ajoute à côté (ex. CC de Vie et Boulogne).
Presque toutes les fiches reprises afficheront « Action incomplète » : pas de
pilote, souvent un titre seul.

## 8. Les personnes

| Dans T&C | Dans TeT |
|---|---|
| Chef de projet, participant, élu référent rattaché | un pilote du dossier, « Prénom Nom », sans compte |
| Contact d'une action | un pilote de la fiche |
| Le rôle (chef de projet, élu…) | non repris : TeT n'en a pas |
| Contact DREAL, Région, ADEME | non repris : TeT désigne le service, pas la personne |

- Même nom exact dans une collectivité = une seule personne ; un nom déjà
  présent dans TeT est réutilisé.
- Jamais rattaché à un compte TeT existant, même à courriel identique.
- L'élu référent tapé à la main (746 dossiers) n'est pas repris : c'est un
  texte libre (fonctions, plusieurs noms).

Aucun compte n'est créé : le pilote apparaît sous son seul « Prénom Nom ».

## 9. Le diagnostic

Les émissions, consommations, polluants, énergies renouvelables et séquestration
sont rangés dans le dossier, ligne par ligne. Les **totaux sont recalculés** par
TeT.

- **Les unités ne sont pas converties** : les chiffres arrivent tels que saisis
  (énergies renouvelables en GWh des deux côtés) ; certains mélangent t et kt
  selon les collectivités.
- TeT recalcule le total des particules PM10 sans le transport routier : le
  total déclaré dans T&C est remplacé par un chiffre plus bas.
- Deux dossiers d'une même collectivité à la même date : leurs totaux se
  mélangent (81 dossiers).
- Le recalcul refait aussi les totaux des autres sources de ces collectivités.

Non repris :

- les objectifs 2021 et 2026 (TeT n'a pas ces colonnes) ;
- la consommation d'énergies renouvelables ;
- les commentaires d'onglet ;
- quelques filières sans ligne dans TeT.

## 10. La vulnérabilité

| Dans T&C | Dans TeT |
|---|---|
| Un domaine (texte libre) | une thématique de TeT (ex. Résidentiel et Tertiaire → Bâtiments) |
| « Forte », « moyenne », « faible », « non » | fort, moyen, faible, non concerné |
| « Oui » sans niveau | non repris : TeT n'a pas de niveau « concerné » |
| Déchets | une thématique propre à la collectivité |
| Objectif | repris tel quel |
| Plusieurs domaines sur une même thématique | une ligne : le niveau le plus haut, les objectifs collés |
| Un aléa (Inondation, Sécheresse…) | sous « Risques naturels » |
| Un libellé non reconnu | non repris, listé |
| Niveaux 2050 et 2100 | vides : T&C ne les demandait pas |

Ex. CC de Vie et Boulogne : Sécheresse « moyen », Incendie « faible ».

## 11. Ce qui n'est pas repris

- l'historique des modifications (dossiers et actions) ;
- les notifications envoyées par T&C ;
- les utilisateurs sans rôle sur un dossier repris ;
- l'élu référent saisi en texte libre ;
- les objectifs 2021 et 2026 du diagnostic ;
- ce qui a été déposé dans T&C après janvier 2026 (72 dossiers, 313 fichiers).

Tout ce qui n'est pas repris est noté, avec sa raison, et peut être retrouvé.

## 12. Encore à décider

| Question | Qui |
|---|---|
| Les 339 dossiers sans état ne sont pas des PCAET d'après T&C : 271 anciens PCET, 63 Cit'ergie, 4 TEPOS, 1 CTE. Ils arrivent aujourd'hui comme PCAET publiés. Les reprendre ainsi, les écarter, ou les reprendre autrement ? | métier |
| Coder l'envoi des secteurs réglementaires vers le nouveau champ « secteurs » (livré sur la plateforme le 08/10/2026) | à venir, après la livraison du champ |

## 13. Avant la migration : qui fait quoi

| Qui | À faire | État |
|---|---|---|
| Équipe technique | Créer le service « Région Pays de la Loire » (33 dossiers transmis de la région en dépendent) | bloquant |
| Équipe technique | Compléter la région de 3 structures : SM Pays Beauce Gâtinais en Pithiverais, PETR Pays de Brie et Champagne, SM du SCOT en Médoc | bloquant |
| Équipe technique | Créer les 4 porteurs absents de TeT : Pays de Sources et Vallées, Aulan, Ouessant, Syndicat mixte du Cotentin | bloquant |
| Équipe technique | Créer le compte « Territoires & Climat », signataire des pièces jointes des fiches | bloquant |
| Équipe technique | Recalcul des totaux du diagnostic : corriger la fuite de mémoire du serveur, ou recalculer par paquets hors heures d'usage | bloquant |
| Équipe technique | Vérifier que les périmètres « en lecture » des services sont calculés en production | à vérifier |
| Équipe technique | Rendre l'archive des fichiers de T&C (98 Go, sur un seul ordinateur) accessible le jour J ; fournir la clé d'accès au stockage | bloquant |
| Équipe technique | Corriger la liste de restauration de staging (3 tables oubliées) pour que les tests ressemblent à la production | non bloquant |
| Équipe produit | Quand une collectivité relie un pilote repris à un vrai compte, le pilote du dossier PCAET est aujourd'hui effacé : le transférer comme les autres rôles | bloquant |
| Équipe produit | « Modifié le » des dossiers repris affiche le jour de l'import : l'accepter ou le corriger | à décider |
| Métier | Les 339 dossiers sans état (anciens PCET, Cit'ergie) : les reprendre comme PCAET publiés ? | à décider |
| Métier | Valider les décisions prises sans le métier (statuts des élaborations, dates d'avis, titres des liens, pilotes, vulnérabilité…) | à faire |
| Reprise | Coder l'envoi des secteurs réglementaires vers le champ « secteurs », livré le 08/10/2026 | à venir |
| Reprise | Annuler puis rejouer toute la reprise sur la copie, pour vérifier les nouvelles règles et le retour à l'identique | à faire |
`;
