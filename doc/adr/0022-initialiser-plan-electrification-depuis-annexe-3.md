# 22. Initialiser un plan Électrification depuis l'annexe 3

Date : 2026-11-03

## Statut

Proposé. Les décisions techniques ci-dessous restent à relire par l'équipe.
Trois arbitrages produit restent ouverts, détaillés en fin de document.

## Contexte

Les collectivités lauréates du programme Électrification remplissent l'annexe 3
de leur convention, puis doivent ressaisir leur plan dans TeT. La
[fonctionnalité](https://app.notion.com/p/40c6523d57d780a7b249d1e85309eb1b)
et son [esquisse](https://app.notion.com/p/3f16523d57d7808ab94ef5f8b79e4c90)
prévoient un import à la création du plan, lancé par la collectivité, avec
des identifiants permettant ensuite le reporting ADEME. L'appétit annoncé
est de deux semaines ; il ne constitue pas une estimation technique validée.

Le tableau A décrit 12 engagements, regroupés dans 11 axes. Seuls les
engagements retenus sont initialisés. Les fiches B peuvent décrire des actions
de référence, des actions propres au territoire ou des actions existantes dans
TeT. Le plan obtenu reste modifiable : aucun verrou métier n'est ajouté.

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
Un fichier de données validé et livré avec le backend suffit ; il ne s'agit
pas de construire une bibliothèque de modèles administrable. Les définitions
d'indicateurs restent dans le catalogue existant, alimenté par l'équipe data.
Les associations sont explicites, sans appel à Grist pendant un import.

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

Créer chaque axe retenu une seule fois, même sans fiche B. E01 et E02
partagent l'axe 1, tout en conservant chacun leur identité. Le numéro d'axe
fait foi sur son intitulé. Les axes libres sont identifiés par le champ prévu
dans l'annexe, sans leur attribuer de code d'engagement. Les quatre familles
ADEME sont une correspondance de reporting, pas un niveau de l'arbre.

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
rattachement dans le plan, conformément à l'esquisse. Une incohérence avec les
engagements retenus est signalée, sans réaffectation silencieuse de ceux-ci.

### 4. Séparer la cible conventionnelle de l'objectif de l'indicateur

Persister les engagements dans des relations dédiées au plan :

| Donnée proposée | Identité et contenu |
| --- | --- |
| Initialisation Électrification | `planId`, collectivité, job source, fichier/hash, version du catalogue, auteur et date |
| Engagement retenu | `(planId, codeEngagement)`, axe associé ; fiche de suivi pour E03/E12 |
| Cible d'engagement | `(planId, codeEngagement, codeCible)`, indicateur associé, valeur nullable, unité et échéance |

Le nombre de cibles d'E07 reste à arbitrer ; la relation permet plusieurs
cibles sans imposer un indicateur unique par engagement. Le catalogue doit
fournir les correspondances exactes, sans inventer d'identifiant d'indicateur.

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

Les objets restent modifiables avec les droits ordinaires. Le renommage local
des indicateurs prédéfinis reste un arbitrage : modifier leur définition globale
affecterait les autres collectivités et n'est pas une option.
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
Le catalogue métier et la correspondance des lauréats avec les collectivités
TeT sont des dépendances, pas des données à déduire par l'IA. La création du
catalogue d'indicateurs reste à la charge de l'équipe data.

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
- Les codes, URL affichées ou masquées derrière un lien et clés de parent
  survivent au pipeline ; deux fiches homonymes restent distinctes.
- Une référence inconnue, incohérente ou inaccessible bloque sans création
  de plan ; une cible absente reste vide ; aucune valeur n'est inventée.
- Une URL réutilise le même objet et conserve champs, valeurs et autres liens.
  Une cible conventionnelle coexiste avec un objectif 2030 déjà renseigné.
- Les personnalisés reçoivent leurs valeurs datées ; les oui/non deviennent
  des sous-actions ; un objectif "Oui" ne vaut pas résultat "Oui".
- Renommer, déplacer ou supprimer reste possible ; les références survivantes
  restent lisibles et les éléments libres ne deviennent pas des références.
- Les erreurs d'écriture et workers concurrents ne laissent aucun agrégat
  partiel ni doublon ; tester la création d'indicateurs dans le rollback.
- Les imports génériques conservent leur comportement. Tester le parcours
  annexe sans `planId` avant succès, le retour sur un job échoué après fermeture
  de la page et les permissions par collectivité.

Privilégier les règles pures, les tests de router avec base réelle et le
[full flow avec faux LLM](../../apps/backend/src/plans/ai-plan-import/ai-plan-import.full-flow.e2e-spec.ts).
La validation qualitative sur des annexes représentatives reste à lancer
manuellement selon le [guide d'évaluation](../../apps/backend/src/plans/ai-plan-import/eval/README.md).
Aucun test automatisé ni agent ne déclenche un appel réel au modèle.

## Questions ouvertes avant implémentation

Les trois premiers points nécessitent un arbitrage produit. Le quatrième
recense les données métier nécessaires à l'implémentation.

1. La V4 contient deux cibles pour E07 : bornes publiques totales et rapides.
   Confirmer leur conservation et le mapping vers les indicateurs.
2. La V4 autorise une fiche sous un axe numéroté non retenu au tableau A,
   contrairement à l'esquisse. Choisir entre refus et axe sans engagement.
3. Confirmer le renommage local des indicateurs prédéfinis et sa portée.
4. Fournir la source maintenue des lauréats, son mapping vers les collectivités
   TeT et le catalogue validé : codes, sous-axes, sous-actions, unités,
   correspondances de cibles et liens d'aides. Le contournement envisagé pour
   les aides est leur ajout dans l'onglet "Documents", à préciser avec le métier.
