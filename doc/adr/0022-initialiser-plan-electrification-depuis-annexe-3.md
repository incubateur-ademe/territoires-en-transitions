# 22. Initialiser un plan Électrification depuis l'annexe 3

Date : 2026-11-03

Dernière mise à jour : 2026-11-04

## Statut

Proposé. Les décisions techniques ci-dessous restent à relire par l'équipe.
Le choix des indicateurs d'E07 est confirmé par l'équipe data. Pour E06 et
E08, les identifiants des indicateurs de parc sont confirmés ; leurs définitions,
leur adéquation métier et leur disponibilité restent à valider avant ouverture.
Les correspondances restant à valider sont détaillées en fin de document.

Le [plan d'implémentation](../plans/2026-11-04-001-feat-import-annexe-3-electrification-plan.md)
découpe ces décisions en incréments déployables séparément.

## Contexte

Les collectivités lauréates du programme Électrification remplissent l'annexe 3
de leur convention, puis doivent ressaisir leur plan dans TeT. La
[fonctionnalité](https://app.notion.com/p/40c6523d57d780a7b249d1e85309eb1b)
et son [esquisse](https://app.notion.com/p/3f16523d57d7808ab94ef5f8b79e4c90)
prévoient un import à la création du plan, lancé par la collectivité, avec
des identifiants permettant ensuite le reporting ADEME. L'appétit annoncé
est de deux semaines ; il ne constitue pas une estimation technique validée.

Le tableau A décrit 12 engagements, regroupés dans 11 axes. Seuls les
engagements retenus sont initialisés, mais une fiche B peut aussi demander
la création d'un axe numéroté sans engagement retenu. Les fiches peuvent décrire
des actions de référence, des actions propres au territoire ou des actions
existantes dans TeT. Le plan obtenu reste modifiable : aucun verrou métier
n'est ajouté.

L'import existant fournit déjà l'upload, la lecture documentaire, l'extraction,
les jobs BullMQ, les checkpoints et la persistance transactionnelle. Il manque
toutefois un contrat structuré pour les engagements, références et indicateurs.
Ses axes sont déduits des fiches ; il ne peut donc pas représenter un axe retenu
sans fiche. Les lecteurs Word et tableur perdent les destinations des liens
dont le texte n'est pas l'URL. Modifier uniquement le prompt ne suffit pas.

Cet ADR propose de remplacer, pour l'initialisation du plan, les orientations
du [plan de travail antérieur](../plans/2026-08-31-001-feat-electrification-indicateurs-plan/phase-2-catalogue-et-parcours-electrification.md) :
provisionnement automatique et verrouillage.
Ce document antérieur est un brouillon, pas une décision acceptée. Les décisions
sur les [périodicités](0018-periodicite-des-indicateurs.md) et les
[vues d'indicateurs](0019-vues-personnalisees-indicateurs.md) restent applicables.

## Décisions

### 1. Un profil d'import dans le parcours existant

Ajouter un profil explicite `annexe-3-electrification` à l'import existant.
Le serveur vérifie sa compatibilité avec le type de plan, l'éligibilité de la
collectivité et les permissions ; le libellé affiché du type de plan ne fait
pas office d'identifiant ni d'autorisation. Conserver le profil et les versions
du contrat d'extraction et du catalogue dans le job et ses checkpoints.

Avant toute reprise, l'API et le worker vérifient que le profil et les versions
du contrat et du catalogue du checkpoint correspondent à ceux du job et sont
pris en charge par le worker. Ce contrôle s'applique aussi à la dernière étape,
en complément de la validation du schéma et des contraintes LLM existantes.
Une ancienne version reste utilisable si elle est explicitement supportée ;
les jobs génériques historiques sans métadonnées restent interprétés en v1.
Un contrat inconnu ou une divergence bloque la reprise avec un diagnostic de
compatibilité, en conservant source et checkpoint selon leur rétention. Aucun
repli générique ni ré-extraction automatique avec un autre contrat ou catalogue.
Un nouvel import explicite reste distinct d'une reprise du même job.

L'orchestration reste dans `plans/ai-plan-import`. Les règles de création du
plan et de ses engagements restent dans `plans`, celles des indicateurs dans
`indicateurs`, conformément aux ADRs [3](0003-conventions-de-code.md),
[11](0011-architecture-service-ddd.md) et [12](0012-pattern-result.md).
Réutiliser les services et la queue existants ; aucun nouveau moteur de
workflow, fournisseur d'IA ou domaine métier n'est nécessaire.

Pour ce profil, créer d'abord le job seul. Le plan sera créé après validation
complète, dans la transaction finale. Cela diffère de l'import générique, qui
crée aujourd'hui un plan vide à l'enfilement. Le suivi et les erreurs restent
accessibles par le job ; l'interface doit accepter l'absence de `planId` tant
que l'import n'a pas réussi. Une référence invalide ne laisse aucun plan créé.
Prévoir un accès persistant au suivi par identifiant de job, échecs compris :
la seule recherche actuelle des jobs en cours ne permet pas de retrouver
un échec après fermeture de la page.

Le retour du service et du contrôleur d'enfilement est discriminé par `profile` :
`{ profile: 'generic', jobId, planId: number }` ou
`{ profile: 'annexe-3-electrification', jobId, planId: null }`.
Le suivi expose `createdPlanId: number | null` ; pour l'annexe, il devient
numérique seulement après le commit final. Pour ce profil, les consommateurs
suivent `jobId` et attendent ce succès avant de naviguer vers le plan. Le nettoyage
d'un échec de stockage ou de mise en queue ne supprime un plan provisoire que
si son identifiant existe ; il libère le job et la source selon les règles
existantes, sans appel à `deleteImportingPlan` avec une valeur absente.
Le contrat générique et le parcours PCAET conservent leur plan immédiat.

### 2. Extraire les données, résoudre les identités dans le code

Le contrat typé conserve séparément : les engagements retenus et leurs cibles,
les axes et sous-axes explicites, les fiches et leurs sous-actions, les codes
ou URL, les indicateurs avec unité, résultat daté et objectif daté. Chaque
élément garde une clé de source et sa localisation dans le document pour les
erreurs et le rattachement parent-enfant. Ni le titre ni sa numérotation ne
servent de clé technique.

L'extraction lit uniquement le tableau A et les fiches B renseignées. Elle
exclut le reste de la convention, les instructions du modèle et la fiche
fictive de la section C. Elle préserve les destinations des hyperliens avant
l'aplatissement du document. Une URL n'est jamais récupérée par une requête
réseau : elle est analysée puis résolue par les services TeT.

Le LLM peut extraire les champs, mais ne choisit pas les identifiants TeT et
ne rapproche pas les éléments par ressemblance. Une étape déterministe :

- résout les codes dans un catalogue versionné et validé métier ;
- résout les URL TeT reconnues, y compris les UID des fiches, dans le périmètre
  autorisé de la collectivité cible ;
- contrôle la cohérence axe/sous-axe, les unités et les dates ;
- distingue une donnée absente de zéro, et un résultat "Oui" d'un objectif "Oui".

Un code ou une URL fourni mais inconnu, ambigu ou inaccessible bloque
l'import, avec la localisation du champ à corriger. Il n'est jamais converti
silencieusement en élément personnalisé. Un champ de référence vide est
autorisé et désigne un élément personnalisé. Une cible d'engagement vide
reste `null`, avec un avertissement non bloquant.
Le champ "Code ou URL" accepte une référence unique ; plusieurs références
contradictoires doivent être corrigées avant import.

Les normalisations génériques ne doivent ni fusionner des fiches distinctes
par leur titre, ni perdre des codes, ni retirer une sous-action identifiée.
Le profil conserve les sous-actions présentes et les conversions oui/non,
même si les options de l'import générique permettent de désactiver leur
extraction. Il ne génère pas d'actions ou de sous-actions supplémentaires,
à l'exception des actions E03/E12 prévues par le contrat métier.

### 3. Un catalogue versionné et une identité indépendante des libellés

Versionner un catalogue limité à ce besoin : axes, sous-axes, engagements,
actions et sous-actions de référence, indicateurs ou jalons oui/non associés.
Pour les actions de référence et leurs indicateurs, la source métier indiquée
par le PM le 3 novembre 2026 est le
[référentiel Grist des actions et indicateurs](https://grist.numerique.gouv.fr/o/100te/m4aC9Epwz7ot/Referentiel-dactions-feuilles-de-routes/p/86).
Version consultée à cette date : "Référentiel V1.3".

Pour les indicateurs d'engagement, Émeline indique le 4 novembre 2026 la colonne
"ID et Titre indicateur TeT v2" de la
[liste des 12 engagements](https://app.notion.com/p/3d66523d57d7805c8206d00be2545ea1).
Cette colonne donne les identifiants de référence TeT à résoudre vers les
définitions du catalogue, pas leurs ID numériques en base. Certains identifiants
désignent des définitions dont la création est annoncée ; leur présence dans
Notion ne garantit pas leur disponibilité dans TeT. Les deux sources ne
sont pas interchangeables : seuls certains indicateurs sont communs, selon sa
[réponse](https://app.notion.com/p/3f16523d57d7808ab94ef5f8b79e4c90?d=40d6523d57d78177b5db001c7ef4622d).
Les correspondances entre codes Grist et identifiants TeT restent à compléter
et à valider ; ne pas les déduire des intitulés.

Un fichier de données validé et livré avec le backend suffit ; il ne s'agit
pas de construire une bibliothèque de modèles administrable. Les définitions
d'indicateurs restent dans le catalogue existant, alimenté par l'équipe data.
Les associations sont explicites, sans appel à Grist ou Notion pendant un import.
Le mapping valide aussi les unités et périodicités : pour un indicateur à
deux unités, seule l'unité principale retenue par le métier est importée,
conformément à l'esquisse. Une fréquence "Ponctuelle" du catalogue ne devient
pas automatiquement une périodicité annuelle dans TeT.

Le catalogue traduit les lignes du tableau A en codes E01 à E12 : ces codes
ne figurent pas dans le Word et ne sont pas affichés à la collectivité.

| Axe du tableau A | Engagements |
| --- | --- |
| 1. Logements privés : sortie du fioul et du gaz | E01, E02 |
| 2. Logements sociaux : sortie du gaz | E04 |
| 3. Bâtiments publics : sortie du fioul et du gaz | E05 |
| 4. Réseau de gaz : décommissionnement de certaines portions | E03 |
| 5. Véhicules particuliers électriques | E06 |
| 6. Bornes de recharge | E07 |
| 7. Recharge des poids lourds | E12 |
| 8. Autobus électriques | E08 |
| 9. Artisans | E09 |
| 10. Industrie | E10 |
| 11. Agriculture | E11 |

Créer une seule fois chaque axe demandé par un engagement retenu ou par
une fiche B. Un engagement retenu crée son axe même sans fiche ; une fiche
peut créer un axe numéroté même si aucun engagement de cet axe n'est retenu,
conformément à l'[arbitrage du PM du 3 novembre](https://app.notion.com/p/3f16523d57d7808ab94ef5f8b79e4c90?d=40d6523d57d781f6a99c001c3befc4d7).
Ce dernier cas est valide et ne demande pas de corriger l'annexe. Il ne crée
ni engagement ni cible : seul le tableau A détermine les engagements retenus.
Un axe sans engagement retenu et absent des fiches n'est pas créé.

E01 et E02 partagent l'axe 1, tout en conservant chacun leur identité.
Le numéro d'axe fait foi sur son intitulé. Les axes libres sont identifiés
par le champ prévu dans l'annexe, sans leur attribuer de code d'engagement.
Les quatre familles ADEME sont une correspondance de reporting, pas un
niveau de l'arbre.

Réutiliser `axe`, `fiche_action` et leurs relations. Ajouter une provenance
structurée aux axes et aux fiches créés depuis une référence : version du
catalogue, nature de la référence et code. La nature distingue notamment une
action de référence, une sous-action de référence et un indicateur oui/non
converti. Pour les indicateurs prédéfinis, conserver leur
`identifiantReferentiel` et leur ID existants.

Cette provenance reste attachée à l'objet lors d'un renommage ou déplacement.
Un élément libre n'en reçoit pas parce qu'il se trouve dans un axe de référence.
Le reporting combine ces identifiants avec les liens et positions actuels :
les éléments supprimés ou sortis du plan ne sont pas comptés, les écarts sont
signalés. Une action de l'axe 1 n'est pas comptée deux fois pour E01 et E02.
Déplacer une action ne change pas les engagements retenus dans la convention.
Le catalogue conserve l'origine de l'action ; son axe actuel détermine son
rattachement dans le plan. Le reporting distingue un axe portant un engagement
retenu d'un axe créé uniquement pour accueillir des fiches. La présence d'une
action ou d'un axe de référence n'ajoute pas d'engagement au tableau A.

### 4. Séparer la cible conventionnelle de l'objectif de l'indicateur

Persister les engagements dans des relations dédiées au plan :

| Donnée proposée | Identité et contenu |
| --- | --- |
| Initialisation Électrification | `planId`, collectivité, job source, fichier/hash, version du catalogue, auteur et date |
| Engagement retenu | `(planId, codeEngagement)`, axe associé ; fiche de suivi pour E03/E12 |
| Cible d'engagement | `(planId, codeEngagement, codeCible)`, indicateur associé, valeur nullable, unité et échéance |

Pour E06 et E08, la [réponse d'Émeline du 4 novembre 2026](https://app.notion.com/p/3f16523d57d7808ab94ef5f8b79e4c90?d=40d6523d57d78177b5db001c7ef4622d)
remplace les indicateurs d'immatriculations annuelles `part_v_h_im.c` et
`part_v_h_im.ef` par des indicateurs de parc. Les lignes mises à jour dans la
colonne "ID et Titre indicateur TeT v2" donnent les références suivantes :

| Engagement | `identifiantReferentiel` TeT | Intitulé TeT | Unité |
| --- | --- | --- | --- |
| [E06](https://app.notion.com/p/3d66523d57d7807a8703ef4460177db4) | `v_particulier_elec` | Part des voitures électriques dans le parc de voitures particulières | % |
| [E08](https://app.notion.com/p/3d66523d57d780999cded9124716b3ed) | `autobus_autocar_elec` | Part des autobus et autocars électriques dans le parc roulant | % |

E06 porte une cible dans l'axe 5, E08 une cible dans l'axe 8. Pour E08, le
périmètre proposé par l'équipe data couvre les autobus et les autocars ;
son adéquation à l'engagement de l'annexe reste à valider. Émeline prévoit de
s'appuyer sur `autobus_elec` et `autocar_elec` ; la définition et sa formule
relèvent de l'équipe data. L'import lie l'indicateur composé sans recalculer
sa valeur ni créer deux cibles à partir de ses composantes.

Ces identifiants sont confirmés, mais les réponses annoncent la création des
définitions et la mise à jour de Notion, sans confirmer leur disponibilité
dans TeT. Avant ouverture du profil, faire valider avec l'équipe data et le
métier les définitions, formules, unités, périodicités et dépendances de calcul,
ainsi que leur adéquation aux engagements, puis vérifier leur intégration dans
l'environnement cible. La confirmation des identifiants ne vaut pas cette
validation complète. Tant qu'elle manque, le profil reste fermé. Une définition
attendue absente bloque avant création du plan,
avec un diagnostic de configuration à traiter par l'équipe ; la collectivité
n'a pas à corriger une annexe valide. Ne pas créer d'indicateur personnalisé
en remplacement ni utiliser les anciens indicateurs d'immatriculations.

Pour E07, Émeline [confirme le 4 novembre 2026](https://app.notion.com/p/3f16523d57d7808ab94ef5f8b79e4c90?d=40d6523d57d78163bb61001cef0db51c)
deux indicateurs déjà existants dans TeT. La
[ligne E07 de la liste des engagements](https://app.notion.com/p/3d66523d57d78028a8b8f67932311e86)
précise les correspondances à utiliser :

| Cible de l'annexe | `identifiantReferentiel` TeT | Intitulé TeT |
| --- | --- | --- |
| Nombre total de bornes publiques | `s_26` | Nombre de bornes de recharge ouvertes au public |
| Nombre de bornes rapides, incluses dans ce total | `s_26.a` | Nombre de bornes de recharge ouvertes au public - Station dédiée à la recharge rapide |

Créer deux cibles distinctes sous l'engagement E07, chacune liée à son
indicateur dans l'axe 6, en conservant l'unité "Nombre de bornes". La relation
permet plusieurs cibles par engagement ; ne pas fusionner ni additionner les
deux valeurs. Une cible vide reste indépendante de l'autre. Réutiliser les
définitions existantes sans modifier leurs formules ni leurs valeurs.

Les codes Grist `6-a` et `6-b` désignent des "points de recharge", avec un seuil
de 150 kW pour `6-b`. La confirmation des indicateurs TeT d'E07 ne valide pas
leur équivalence avec ces codes : cette correspondance reste à établir pour
les fiches B qui les citent. Ne pas convertir des points en bornes ni ajouter
ce seuil aux cibles de l'annexe.

Les cibles du tableau A sont des données de convention, distinctes de
`indicateur_valeur.objectif`. Les présenter comme "Cible de l'annexe 3" à côté
du suivi de l'engagement ; elles ne remplacent ni les objectifs déjà saisis ni
les résultats. Ne pas détourner une source de valeurs pour représenter cette
différence métier. Les objectifs courants restent modifiables ; le changement
des engagements de convention ne fait pas partie de cette livraison.

Pour E03 et E12, créer une fiche ordinaire sous l'axe concerné, avec une
référence d'engagement et un statut initial "À venir". "Engagement retenu :
Oui" ne signifie pas "Réalisé". Le suivi utilise ensuite le statut de la fiche.

Supprimer ou déplacer les éléments opérationnels reste possible. La trace
des engagements importés reste liée au plan et permet de constater un lien
manquant ; elle ne recrée pas les éléments supprimés. Les liens vers les
éléments supprimés physiquement deviennent nuls, sans empêcher leur suppression.
Les fiches supprimées logiquement sont exclues des lectures de suivi même si
leurs relations existent encore en base.
Supprimer le plan supprime ses données d'engagement.

### 5. Créer ou relier sans altérer les données existantes

| Référence dans l'annexe | Comportement |
| --- | --- |
| Code d'action connu | Créer une fiche avec la provenance de référence ; reprendre les champs renseignés de l'annexe et les compléments du catalogue prévus pour cette référence. |
| URL de fiche existante | Ajouter son rattachement au plan, sans copier la fiche, déplacer ses autres liens ou modifier son contenu, ses sous-actions et ses indicateurs. |
| Action sans code ni URL | Créer une fiche libre sous l'axe/sous-axe indiqué. |
| Code d'indicateur connu | Lier la définition du catalogue ; ne pas recréer l'indicateur ni écraser des valeurs locales. |
| URL d'indicateur existant | Ajouter le lien vers cet indicateur, en conservant tous ses champs, valeurs et liens existants. |
| Indicateur sans code ni URL | Créer un indicateur personnalisé avec titre, unité, résultat et objectif lorsque renseignés. |

Le compte rendu signale les données de l'annexe non appliquées aux objets
désignés par URL, pour rendre cette conservation explicite.

Le profil importe les titres, descriptions, objectifs textuels, structures
pilotes, partenaires, dates, statuts et sous-actions. Les données de l'annexe
priment sur les valeurs de préremplissage du catalogue pour une nouvelle fiche.
Les codes identifient les sous-actions de référence ; une même sous-action
n'est pas ajoutée deux fois depuis le catalogue et l'annexe. Les moyens humains
ne sont repris que s'ils sont effectivement renseignés, sans les déduire du
nom d'une structure pilote. Aucun compte utilisateur n'est créé depuis ces noms.

Pour les nouveaux indicateurs personnalisés, la V4 fournit un résultat avec
son année et un objectif à 2030. Utiliser la périodicité annuelle de ces données ;
respecter la périodicité fixe d'une définition déjà existante. Une valeur sans
unité ou période exploitable est signalée, jamais affectée à une unité ou date
inventée. Pour un indicateur de catalogue, compléter seulement les valeurs
absentes après validation ; conserver et signaler tout conflit avec une valeur
existante. Le chemin URL reste strictement limité aux liens, même si un champ
de l'indicateur est vide.

Un indicateur oui/non devient une sous-action de `fiche_action`, reliée par
`parentId`, avec son titre et sa référence conservés. Un résultat "Oui" donne
le statut "Réalisé" ; "Non" donne "À venir". Une réponse vide est signalée
et ne constitue pas une réalisation. L'année d'objectif devient une échéance
en fin d'année, explicitement conventionnelle, sans inventer de date réelle
d'achèvement. Ne pas confondre ces sous-actions avec les anciennes étapes de fiche.
Conserver aussi la réponse extraite et sa période d'observation dans la
provenance : le statut modifiable et l'échéance ne remplacent pas cette information.

Les objets restent modifiables avec les droits ordinaires. Pour les indicateurs
prédéfinis, le [PM confirme le maintien du titre commun à toutes les collectivités](https://app.notion.com/p/3f16523d57d7808ab94ef5f8b79e4c90?d=40d6523d57d781f0bd1d001c893e9e4e) :
leur titre ne peut pas être renommé, et cette livraison n'ajoute pas de libellé
local. Un intitulé différent dans l'annexe ne modifie pas le titre du catalogue.
Les indicateurs personnalisés restent renommables selon les droits existants.
Retirer un indicateur prédéfini du plan supprime son lien local, pas sa
définition de catalogue ni ses valeurs dans la collectivité.

### 6. Une transaction de création, des reprises du même job

Étendre le contrat de création d'agrégat avec des axes explicites et des clés
de source pour les parents. Composer les services de fiches, d'axes,
d'indicateurs et de valeurs dans une même transaction, propagée à chacun.
La création d'un indicateur personnalisé doit notamment accepter cette
transaction, en conservant les protections existantes de son graphe de calcul.

Vérifier les droits d'import, de création d'indicateurs et de liaison des
objets résolus, puis les revérifier au moment des écritures. Une URL ne donne
aucun droit supplémentaire : une fiche d'une autre collectivité nécessite
le partage et les permissions ordinaires permettant sa liaison. Les liens
sont ajoutés, jamais remplacés par la seule liste issue de l'annexe.

Le plan, ses axes, les nouvelles fiches, les liens, les indicateurs créés,
leurs valeurs et les engagements sont enregistrés avec la réussite du job.
Tout échec annule ces écritures. Conserver le contrôle `status`/`attempt`
existant pour empêcher un ancien worker de valider après une reprise.
Les notifications de réussite et autres effets externes ont lieu après le
commit ; leur éventuel échec ne relance pas la création des données.
Cela nécessite de différer les webhooks de l'agrégat, aujourd'hui émis dans
sa transaction, jusqu'à la validation effective du job.

Une reprise technique réutilise le même job et les checkpoints compatibles ;
elle ne crée pas un second plan. Un nouvel import n'est pas une mise à jour
de convention : conserver l'avertissement existant sur les fichiers déjà
importés et ne pas proposer de fusion ou de synchronisation. Un document
corrigé après validation métier passe par un nouvel import explicitement
distingué d'une reprise ; le remplacement d'un plan existant relève du support.

## Périmètre et dépendances

La livraison principale comprend l'import, les identités de référence,
les engagements, les indicateurs et le respect des données existantes.
Les sources du catalogue métier sont identifiées : Grist pour les références
d'actions et leurs indicateurs, la table Notion pour les indicateurs
d'engagement. L'intégration des définitions manquantes, la validation des
correspondances encore ouvertes et celle des lauréats avec les collectivités
TeT restent des dépendances, pas des données à déduire par l'IA. L'alimentation
du catalogue d'indicateurs reste à la charge de l'équipe data ; les définitions
déjà présentes, notamment les deux indicateurs d'E07, sont réutilisées.

Un mapping lauréat–collectivité absent, obsolète ou ambigu rend le profil
indisponible pour la collectivité et bloque l'enfilement, avant toute création
de plan, avec un diagnostic de configuration. Il ne justifie aucun rapprochement
par ressemblance. Conserver la source et la version du mapping utilisées pour
la décision d'éligibilité ; les jobs admis les enregistrent dans leur provenance.
Une non-éligibilité établie par un mapping valide reste distincte d'une
configuration manquante.

**Étape supplémentaire facultative : budgets et financements.** Leur import
est un "nice to have" distinct, confirmé pendant la rédaction. Le socle peut
être livré sans lui, en indiquant les champs non repris. Cette étape devra
mapper investissement/fonctionnement et données de financement vers les
modèles actuels de budget, préserver les montants existants et couvrir unités,
périodes et valeurs absentes. Ne pas utiliser `budgetPrevisionnel`, déprécié.

Sont hors périmètre : dashboard ADEME, ajout d'actions du catalogue après
import, modification des engagements, réimport avec fusion, gestion native
des groupements et export Word. Les non-lauréats peuvent garder un plan
Électrification ordinaire, sans initialisation conventionnelle ni reporting.
Les plans existants ne sont ni migrés ni supprimés automatiquement.

## Alternatives et conséquences

- **Modifier uniquement les prompts** ne couvre ni les identités stables,
  ni les liens existants, ni l'écriture des indicateurs.
- **Parser uniquement un Word figé** réduirait les variations d'extraction,
  mais ne couvre pas les documents adaptés par les collectivités. Réutiliser
  les lecteurs existants et valider un contrat métier explicite.
- **Recréer les fiches et indicateurs désignés par URL** produit des doublons
  et sépare l'historique de suivi ; conserver les objets existants.
- **Utiliser l'objectif courant comme cible conventionnelle** mélange deux
  données qui doivent coexister et peut écraser une saisie locale.
- **Verrouiller le plan ou développer un moteur générique de modèles** ajoute
  un fonctionnement que le cadrage actuel ne demande plus.

Le choix réutilise l'infrastructure d'import mais impose des migrations et
des évolutions de contrats, de lecteurs et d'affichage. La cible conventionnelle
distincte ajoute une donnée à expliquer dans l'interface. La liberté d'édition
rend possibles les écarts au plan initial ; le reporting doit les distinguer
d'un résultat nul et le support doit pouvoir les retrouver.

## Validation attendue

Ces critères décrivent les tests à réaliser pendant l'implémentation, pas des
tests déjà exécutés :

- Une convention V4 avec modèle vide et exemple fictif n'importe que les vraies
  fiches B ; un axe retenu sans fiche est créé ; E01/E02 partagent un axe.
- Une fiche sous un axe numéroté sans engagement retenu crée cet axe sans
  erreur, engagement ni cible supplémentaires ; un axe non demandé reste absent.
- Les codes, URL affichées ou masquées derrière un lien et clés de parent
  survivent au pipeline ; deux fiches homonymes restent distinctes.
- Une référence inconnue, incohérente ou inaccessible bloque sans création
  de plan ; une cible absente reste vide ; aucune valeur n'est inventée.
- Une URL réutilise le même objet et conserve champs, valeurs et autres liens.
  Une cible conventionnelle coexiste avec un objectif 2030 déjà renseigné.
- Après validation métier et intégration des définitions, E06 et E08 lient
  respectivement `v_particulier_elec` et `autobus_autocar_elec`
  dans les axes 5 et 8, avec une cible chacun. Une définition manquante bloque
  avant création du plan, sans substitution par un indicateur d'immatriculations
  ou personnalisé, et sans demander de corriger l'annexe.
- E07 crée deux cibles distinctes liées à `s_26` et `s_26.a` dans l'axe 6,
  sans recréer les indicateurs ni modifier leurs valeurs ou formules. Une cible
  vide ne supprime pas l'autre ; le total et sa partie rapide ne sont pas additionnés.
- Les personnalisés reçoivent leurs valeurs datées ; les oui/non deviennent
  des sous-actions ; un objectif "Oui" ne vaut pas résultat "Oui".
- Renommer les axes, fiches et indicateurs personnalisés, déplacer ou retirer
  les liens reste possible ; les références survivantes restent lisibles et
  les éléments libres ne deviennent pas des références. Le titre d'un indicateur
  prédéfini reste celui du catalogue, sans renommage local ni global par l'import.
- Les erreurs d'écriture et workers concurrents ne laissent aucun agrégat
  partiel ni doublon ; tester la création d'indicateurs dans le rollback.
- Les imports génériques conservent leur comportement. Tester le parcours
  annexe sans `planId` avant succès, le retour sur un job échoué après fermeture
  de la page et les permissions par collectivité. Un échec d'enfilement sans
  plan n'appelle pas sa suppression et ne laisse aucun job bloquant les quotas.
- Une divergence de profil ou de version contrat/catalogue entre job et
  checkpoint interdit la reprise, même après la dernière étape. Un format non
  supporté conserve source et checkpoint ; les checkpoints génériques v1 restent
  reprenables. Une reprise autorisée revalide références et droits avant écriture.
- Un mapping lauréat–collectivité absent, obsolète ou ambigu bloque avant
  enfilement et création du plan ; source et version de la décision sont traçables.

Privilégier les règles pures, les tests de router avec base réelle et le
[full flow avec faux LLM](../../apps/backend/src/plans/ai-plan-import/ai-plan-import.full-flow.e2e-spec.ts).
La validation qualitative sur des annexes représentatives reste à lancer
manuellement selon le [guide d'évaluation](../../apps/backend/src/plans/ai-plan-import/eval/README.md).
Aucun test automatisé ni agent ne déclenche un appel réel au modèle.

## Questions ouvertes et dépendances avant implémentation

1. Valider avec l'équipe data et le métier les définitions de `v_particulier_elec`
   et `autobus_autocar_elec` : formules, unités, périodicités, dépendances de calcul
   et adéquation à E06/E08, notamment le périmètre autobus/autocars. Le passage
   des immatriculations au parc et les identifiants sont confirmés ; cette
   validation complète et l'intégration dans TeT conditionnent l'ouverture.
2. Valider une version exploitable du catalogue et compléter le mapping
   Grist vers TeT : codes, sous-axes, sous-actions, unités et liens d'aides.
   Cela inclut l'éventuelle correspondance de `6-a`/`6-b` avec les indicateurs
   E07, distincte du choix confirmé de `s_26`/`s_26.a` pour les engagements.
   Le contournement envisagé pour les aides est leur ajout dans l'onglet
   "Documents", à préciser avec le métier.
3. Fournir la source maintenue des lauréats et son mapping vers les
   collectivités TeT, avec une version et une validité vérifiables.
