# 22. Initialiser un plan Électrification depuis l'annexe 3

Date : 2026-11-03

Dernière mise à jour : 2026-11-11

**Décision du 11 novembre :** la publication du catalogue et des lauréats
sans déploiement est isolée dans la [PR #5815](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5815), basée sur B
(`feat/electrification-data-publication`). B conserve ses configurations
embarquées et ne dépend pas de cette évolution pour son déploiement.

## Statut

Proposé, à relire par l'équipe. Les deux PRs ci-dessous appliquent le
périmètre élargi et restent non fusionnées. A reprend aussi les refactorings
actifs qui préservent le comportement actuel ; B garde les changements
fonctionnels, dont un profil public PCAET distinct. La CI de A du 10 novembre
est verte ; les nouveaux commits restent à vérifier en CI. B a passé les
contrôles locaux décrits dans le plan, avec un échec navigateur intermittent
à qualifier. Les résultats antérieurs restent
historiques. La qualification intégrée et les données métier manquantes
empêchent encore l'ouverture en production.

Les [retours de recette TT-67 du 11 novembre][retours-tt67] et la réponse sur
les aides sans URL sont pris en compte dans B. Validation locale : 199 e2e
backend, cinq scénarios navigateur ciblés et 16 tests frontend réussis avec
une IA simulée. La recette de la version déployée reste à effectuer ; les
preuves antérieures ci-dessous conservent leur date et leur périmètre.

**Décision du 10 novembre 2026 : deux livraisons.** Le
[plan d'implémentation](../plans/2026-11-04-001-feat-import-annexe-3-electrification-plan.md)
remplace la stack de quinze PRs par les deux périmètres suivants :

| Livraison                           | Contenu                                                                                                                                                       | Effet sur les parcours actuels                                                                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [PR A — Fondations][pr-foundations] | Contrats, catalogue, résolveurs, refactorings de l'import actif, primitives transactionnelles d'indicateurs et options internes communes.                     | Comportement utilisateur et contrats publics conservés ; frontend, schéma SQL, lecteurs documentaires et calculs identiques à `main`. Déployable seule après validation. |
| [PR B — Import complet][pr-import]  | Profils fonctionnels et admission, historique, extraction, structure et persistance du plan, valeurs et calculs, migration, parcours app et flag de création. | Nouveaux comportements et raccordements ; qualification de non-régression requise, même avec le flag Électrification fermé.                                              |

A part de `main` ; B part de A, avec un seul commit par PR. Aucun flag
supplémentaire n'est introduit pour ce découpage. Le blocage actuel de création
Électrification reste en place dans A. B conserve les décisions de création, de reprise et de source par plan
ci-dessous ; leur regroupement ne signifie pas une ouverture du profil.

Le catalogue de A est `electrification-v1` : 11 axes, 41 sous-axes et les
correspondances des engagements. Seules les deux cibles E07 ont leurs
métadonnées validées. Les neuf autres cibles restent `pending`, avec une
périodicité `annuelle`. Le catalogue contient les 109 actions, leurs 58
sous-actions et les 113 codes d'indicateurs Grist. Les correspondances TeT
de ces indicateurs restent `pending`, avec une référence `null`.
Le mapping lauréats contient 105 correspondances : 77 vérifiées et
28 porteurs de groupements repris provisoirement ; 4 cas restent en attente.
Dans B, la collectivité de démonstration `5460` s'ajoute avec la référence
synthétique `demo-5460`, réservée à la recette et distincte des 105 lauréats.
Dans B, les correspondances incomplètes bloquent seulement les imports qui
les utilisent, y compris comme compléments automatiques. L'admission contrôle
l'intégrité du catalogue ; le flag, les droits et l'éligibilité restent requis.
La relecture des specs du 10 novembre est intégrée au code le 11 novembre :
périodicités annuelles dans A, unité canonique E09 `nb` dans A et adaptation
documentaire dans B. Les définitions déployées restent à vérifier.

Les preuves métier sont datées dans cet ADR. A est ouverte à la review ; B
reste en draft. La préproduction actuelle, les éventuels jobs déjà créés et
le parcours intégré restent à qualifier.
Les anciennes références aux lots 1B à 7A décrivent l'historique de conception,
pas l'ordre de livraison courant. Leur traçabilité est conservée dans
[l'historique](#historique-des-décisions-et-des-prs).

## Contexte

Les collectivités lauréates du programme Électrification remplissent l'annexe 3
de leur convention, puis doivent ressaisir leur plan dans TeT. La
[fonctionnalité](https://app.notion.com/p/40c6523d57d780a7b249d1e85309eb1b)
et son [esquisse](https://app.notion.com/p/3f16523d57d7808ab94ef5f8b79e4c90)
prévoient un import à la création du plan, lancé par la collectivité, avec
des identifiants permettant ensuite le reporting ADEME. L'appétit annoncé
est de deux semaines ; il ne constitue pas une estimation technique validée.

Le tableau A décrit 12 engagements, regroupés dans 11 axes. Seuls les
engagements retenus sont initialisés, mais une fiche action peut aussi demander
la création d'un axe numéroté sans engagement retenu. Les fiches actions peuvent
décrire des actions de référence, des actions propres au territoire ou des actions
existantes dans TeT. Le plan obtenu reste modifiable : aucun verrou métier
n'est ajouté.

Le terme métier est "fiche action" (`Fiche`, `ficheId`). La section B du
document décrit les fiches actions à créer ou à relier à des fiches actions
existantes. Le repère B sert uniquement à l'extraction et aux localisations
dans le document. Une référence d'import peut aussi désigner un indicateur.

L'import existant fournit déjà l'upload, la lecture documentaire, l'extraction,
les jobs BullMQ, les checkpoints et la persistance transactionnelle. Il manque
toutefois un contrat structuré pour les engagements, références et indicateurs.
Ses axes sont déduits des fiches ; il ne peut donc pas représenter un axe retenu
sans fiche. Les lecteurs Word et tableur perdent les destinations des liens
dont le texte n'est pas l'URL. Modifier uniquement le prompt ne suffit pas.

La création de nouveaux plans Électrification est temporairement suspendue
par la [PR #5673](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5673).
Cet ADR décrit le fonctionnement cible ; les premiers lots de préparation
conservent ce blocage. Son remplacement fait partie de la livraison du parcours
complet, avec les contrôles de profil, d'éligibilité et de droits.

Cet ADR propose de remplacer, pour l'initialisation du plan, les orientations
du [plan de travail antérieur](../plans/2026-08-31-001-feat-electrification-indicateurs-plan/phase-2-catalogue-et-parcours-electrification.md) :
provisionnement automatique et verrouillage.
Ce document antérieur est un brouillon, pas une décision acceptée. Les décisions
sur les [périodicités](0018-periodicite-des-indicateurs.md) et les
[vues d'indicateurs](0019-vues-personnalisees-indicateurs.md) restent applicables.

## Décisions

Les décisions suivantes décrivent la cible complète. A contient les contrats,
le catalogue et les résolveurs, ainsi que les refactorings actifs qui conservent
le comportement actuel. B ajoute les comportements, les écritures métier,
la migration et l'interface nécessaires à l'import Électrification.

**Élargissement de A — 10 novembre 2026.** `GenerateImportDraftService`
coordonne le job et délègue l'extraction/persistance existante à
`GenerateGenericImportService` via un contrat commun de génération.
`CompletePlanImportService` regroupe la finalisation du plan et du job dans
la transaction fournie par l'appelant ; il ne prend pas possession de cette
transaction. Les droits, quotas, checkpoints, erreurs affichées et effets
après commit conservent leur comportement actuel. Les messages déplacés vers
les définitions d'erreurs gardent leur texte.

La politique PCAET interne réutilise le choix actuel de `withSecteurs` selon
le type exact. A ne crée aucun profil public PCAET : `GENERIC` et
`ELECTRIFICATION` partagent désormais leur enum dans le domaine, avec les
valeurs publiques `generic` et `annexe-3-electrification` inchangées.
`isImportProfileImplemented` continue de refuser Électrification.

A ajoute la propagation d'une transaction appelante pour la création d'un
indicateur et les sources, ainsi qu'une méthode de liaison additive. Les
appels actuels sans transaction explicite et les anciens upserts de liens
conservent leur contrat. Les nouvelles méthodes ne sont pas un raccordement
du pipeline Électrification. A ne modifie pas les lecteurs documentaires,
la réconciliation des valeurs ni les calculs.

L'option commune `requireExplicitActivation` remplace l'exception par nom de
flag dans le tracker. Le guard de bypass diagnostic PCAET la passe explicitement
pour conserver sa politique actuelle. Les autres appelants gardent leur
évaluation habituelle ; aucun nouveau flag n'est ajouté dans A.
Le schéma partagé de tokens reprend les champs existants sans modifier leur
comptabilisation.

### 1. Un profil d'import dans le parcours existant

Ajouter un profil explicite `annexe-3-electrification` à l'import existant.
Dans B, distinguer également le profil public PCAET du profil générique :
PCAET conserve le moteur documentaire multiformat commun, son plan créé dès
l'enfilement et sa politique de secteurs. L'admission exige le type PCAET exact
(catégorie et type) ; le serveur décide de l'extraction des secteurs. Le profil
et le checkpoint doivent concorder, sans nouvelle version du moteur. Cette distinction fonctionnelle
reste hors de A. Les anciens jobs PCAET enregistrés comme `generic` restent
reprenables avec leur profil, leurs options `withSecteurs` et leurs checkpoints
existants ; aucun job n'est réétiqueté et aucun fichier n'est ré-extrait pour
le faire passer au nouveau profil. B doit vérifier admission, type exact et
reprise du nouveau profil sans dupliquer le moteur documentaire.

Le déploiement de B met à jour tous les workers avant l'admission du nouveau
profil `pcaet` par l'API et le frontend. A ne sait pas le traiter ; un rollback
vers A doit donc attendre la fin des jobs PCAET admis avec B. Les anciens jobs
`generic` restent compatibles dans les deux versions. Le flag Électrification
ne constitue pas un garde-fou pour ce changement PCAET.

**Décision du 11 novembre 2026 — quota de recette et de support.** Dans B,
la permission `plans.fiches.import_without_daily_quota`, réservée au mode
super-admin actif, dispense du quota de 10 imports par collectivité sur
24 heures glissantes. Elle s'applique aux profils générique, PCAET et
Électrification. Les autres utilisateurs, y compris le support sans ce mode
actif, restent soumis au quota ; les imports échoués continuent d'y compter.
L'exception existante de concurrence par utilisateur reste distincte. Le
plafond global d'imports simultanés et l'unicité d'un import en cours par
collectivité restent applicables. Aucun historique n'est supprimé et cette
permission ne contourne ni le flag, ni l'éligibilité, ni la validation du
catalogue ou du document. Le lancement d'un import réel reste humain.

Les règles propres au programme utilisent le nom `Electrification` ; "annexe 3"
désigne la section du document officiel. L'identifiant de profil déjà livré
reste inchangé pour préserver les contrats des jobs et de l'API.
Le serveur vérifie sa compatibilité avec le type de plan, l'éligibilité de la
collectivité et les permissions. Identifier le type dans `plan_action_type`
par son couple unique `(categorie, type)`, selon le fonctionnement du PCAET,
puis utiliser son ID dans les relations existantes. Le couple Électrification
est `("Plans thématiques", "Plan Électrification")`. Le titre du plan reste libre ;
ni lui ni le choix d'un type ne donnent une autorisation. Les types sont
accessibles en lecture seule aux collectivités ; toute modification technique
de leur couple doit rester cohérente avec les règles qui l'utilisent.
Une migration de données idempotente crée ce type s'il manque, sans modifier
son ID s'il existe déjà. Son rollback conserve la ligne et les plans associés.
Conserver le profil et la version du catalogue dans le job et ses checkpoints.
Le checkpoint Électrification porte une seule version technique : `schemaVersion`.
Le lot 5B enregistre cette même version dans le job, avec le canevas reconnu,
pour contrôler leur concordance.

Avant toute reprise, l'API et le worker vérifient la compatibilité du checkpoint
selon son profil, ainsi que la concordance du profil et du catalogue avec le job.
Ce contrôle s'applique aussi à la dernière étape. Pour Électrification, il valide
`schemaVersion`, sa concordance avec le job et le canevas reconnu. Le profil
générique conserve ses contrôles de contrat, de schéma et de LLM déjà livrés.
Une ancienne version reste utilisable si elle est explicitement supportée ;
les jobs génériques historiques sans métadonnées restent interprétés en v1.
Un contrat inconnu ou une divergence bloque la reprise avec un diagnostic de
compatibilité, en conservant source et checkpoint selon leur rétention. Aucun
repli générique ni ré-extraction automatique avec un autre contrat ou catalogue.
Un nouvel import explicite reste distinct d'une reprise du même job.

L'orchestration reste dans `plans/ai-plan-import`. Les règles de création du
plan, de ses axes et de ses fiches restent dans `plans`, celles des indicateurs dans
`indicateurs`, conformément aux ADRs [3](0003-conventions-de-code.md),
[11](0011-architecture-service-ddd.md) et [12](0012-pattern-result.md).
Réutiliser les services et la queue existants ; aucun nouveau moteur de
workflow, fournisseur d'IA ou domaine métier n'est nécessaire.

Le [contrat des champs de fiche importée](../../packages/domain/src/plans/fiches/fiche-import.schema.ts)
et les contrôles de titre et de dates appartiennent à `@tet/domain/plans`.
L'import Excel utilise ces mêmes contrôles en conservant ses erreurs actuelles.
La [préparation commune des fiches](../../apps/backend/src/plans/ai-plan-import/prepare-fiche/prepare-fiche.rules.ts)
reçoit les références et les compléments déjà résolus : elle fusionne les champs,
valide les dates et complète les sous-actions sans doublon de code. Les
sous-actions libres homonymes restent distinctes. Son contrat documentaire et
ses diagnostics restent dans l'import ; elle ne lit ni catalogue ni base.
L'orchestrateur Électrification garde la résolution des codes, les axes et
sous-axes, les engagements et les règles d'indicateurs. Aucun service Nest
générique supplémentaire n'est nécessaire pour cette préparation des fiches.

Les deux résolutions partagent le contrôle des clés de source. La distinction
entre code et URL appartient aux règles de références existantes, qui gardent
la validation stricte des liens. Les résolveurs Excel qui créent des tags restent
réservés à l'étape d'écriture. Les helpers de fusion par titre et de suppression
silencieuse des doublons ne conviennent pas à la préparation par code et clé documentaire.

Le [contrat métier des engagements](../../packages/domain/src/plans/plans/engagement.schema.ts)
appartient au domaine `plans` et est exporté par `@tet/domain/plans`.
`Engagement` décrit un code et ses cibles `EngagementCible` (clé, valeur,
unité, année), sans dépendance à l'IA ni au document d'origine. Il est
utilisable par le backend et l'app dans les parcours du plan. Les champs
non renseignés restent nullables ; le contrat ne fixe ni liste de codes,
ni échéance, ni bornes métier sur les valeurs.

L'[adaptation pour l'import](../../apps/backend/src/plans/ai-plan-import/models/engagement-import.schema.ts)
compose ces schémas et ajoute uniquement les
[sources documentaires](../../apps/backend/src/plans/ai-plan-import/models/import-source.schema.ts)
aux engagements et cibles. Ces sources restent dans le backend d'import,
où elles servent aussi aux axes et aux diagnostics.

Le schéma d'entrée Électrification compose ce contrat commun. La configuration
du programme porte les correspondances E01–E12 ; le résolveur applique les
cibles annuelles en 2030, la structure des tableaux A/B et le contrôle des
deux cibles E07.
Les traitements resteront spécifiques tant qu'un deuxième programme ne
partage pas effectivement ces règles. Pour cet import, les axes, fiches,
indicateurs et sources de valeurs existants portent les données métier,
sans nouvelle entité persistante d'engagement.

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
B étend cette réponse au profil PCAET distinct, également avec un `planId`
numérique immédiat ; A conserve le contrat public actuel.
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
servent de clé technique. Dans le résultat préparé, `fiches` contient les
fiches actions décrites dans le document ; `fichesEngagements` contient celles
issues des engagements E03/E12.

L'extraction lit uniquement le tableau A et les fiches actions renseignées
dans la section B. Elle exclut le reste de la convention, les instructions du
modèle et la fiche fictive de la section C. Elle préserve les destinations des
hyperliens avant l'aplatissement du document. Une URL n'est jamais récupérée
par une requête réseau : elle est analysée puis résolue par les services TeT.

La lecture conserve le libellé, la destination et les coordonnées d'origine
des liens séparément du texte générique. Les liens rattachables à une ligne
la suivent pendant la normalisation et le découpage ; ceux sans contexte
textuel restent dans le registre de leur page, sans attribution à une fiche
voisine. L'extraction consulte les deux. Une destination illisible reste
signalée comme telle ; elle n'est pas déduite du libellé et les formules du
tableur ne sont pas exécutées. Ce contrat documentaire, préparé dans le lot historique 3A, est repris dans
la [PR B du plan](../plans/2026-11-04-001-feat-import-annexe-3-electrification-plan.md#pr-b--import-complet).

**Implémentation du lot 3B, 9 novembre 2026.** Le profil accepte uniquement
le canevas officiel V4 au format DOCX. Le lecteur conserve les tableaux,
cellules et hyperliens avant l'aplatissement utilisé par l'import générique.
L'[extracteur Électrification](https://github.com/incubateur-ademe/territoires-en-transitions/blob/feat/electrification-plan-import/apps/backend/src/plans/ai-plan-import/electrification/extract-plan/extract-electrification-plan.ts)
reconnaît les sections et libellés du formulaire, sans dépendre d'indices de
ligne fixes. Il copie les descriptions libres et les valeurs explicites, puis
applique des conversions contrôlées. Le préambule, les textes d'aide connus,
les fiches vierges et l'exemple fictif C sont exclus. Des tableaux B dupliqués
représentent des fiches distinctes, même lorsque leurs titres sont identiques.

Le canevas officiel ne peut pas être modifié : il constitue le contrat d'entrée.
La [définition du canevas officiel](https://github.com/incubateur-ademe/territoires-en-transitions/blob/feat/electrification-plan-import/apps/backend/src/plans/ai-plan-import/electrification/extract-plan/electrification-document-template.constants.ts)
regroupe ses libellés, textes d'aide et correspondances entre les lignes du
tableau A et les codes d'engagement. Ces repères documentaires restent séparés
des règles d'extraction et du catalogue métier. Une variante supplémentaire
doit provenir d'un document observé et être couverte par les tests.
Les titres d'axes attendus dans le Word appartiennent à cette définition du
canevas. Leur reconnaissance ne dépend pas des titres du catalogue métier :
renommer un axe métier ne change pas le document accepté. Le rattachement par
numéro et l'existence de l'axe dans le catalogue restent contrôlés ; le titre
du plan préparé provient du catalogue.
Une reformulation arbitraire d'un texte d'aide dans une cellule libre peut être
indiscernable d'une saisie : le parser ne garantit pas de la détecter ou de
l'exclure. Cette limite ne justifie ni un rapprochement approximatif ni un
fallback IA.

Chaque élément conserve sa source documentaire ; les références sont lues dans
leur cellule et contrôlées contre le texte et les destinations des liens.
Un format ou une structure non reconnus, ou une valeur invalide dans un champ
contrôlé, donnent un diagnostic localisé. Aucune donnée manquante n'est complétée
par un modèle. Les dates, statuts, Oui/Non, codes et URL restent traités par le
code, y compris pour une fiche existante référencée par URL. Il n'y a ni OCR,
ni fallback vers le pipeline générique. Les PDF, tableurs et documents
restructurés nécessiteraient un périmètre et une validation propres.
Le chemin générique, ses formats et ses stratégies d'extraction restent inchangés.

**Assistance ciblée.** Après reconnaissance du formulaire, le code isole
les cellules de cibles d'engagement ou de valeurs numériques d'indicateurs que
le parser ne comprend pas. Une valeur déjà reconnue n'est pas soumise au modèle.
Seules ces cellules et leur contexte utile sont transmises au `LlmService`
existant ; les autres erreurs ne déclenchent pas d'appel. Le modèle propose une
interprétation structurée avec les nombres, unités et années littéralement
présents, ainsi que leurs citations exactes. Il ne choisit aucun identifiant
TeT et ne reformule pas les descriptions.

Les [contrôles d'interprétation](https://github.com/incubateur-ademe/territoires-en-transitions/blob/feat/electrification-plan-import/apps/backend/src/plans/ai-plan-import/electrification/extract-plan/electrification-value-interpretation.rules.ts)
vérifient la cellule source, les citations, les emplacements attendus et la
conservation des nombres, puis l'interprétation repasse dans le même
parser et les mêmes validateurs. Une plage, une information manquante, une
référence inconnue ou une interprétation non vérifiable reste bloquante ; aucun
score de confiance ne permet de contourner un contrôle. Ces vérifications
réduisent les possibilités d'invention, sans prouver que l'association d'un
nombre à son sens est correcte. L'évaluation doit donc mesurer séparément les
rejets injustifiés et les valeurs incorrectes acceptées silencieusement.

Le [checkpoint d'extraction](https://github.com/incubateur-ademe/territoires-en-transitions/blob/feat/electrification-plan-import/apps/backend/src/plans/ai-plan-import/electrification/extract-plan/electrification-extraction-checkpoint.schema.ts)
est strict et propre au profil : `schemaVersion: 1`,
`templateVersion: "electrification-v4"`, `documentKind: "docx"` et version du
catalogue. Il conserve le résultat documentaire, les sources originales et les
interprétations acceptées, sans ID résolu. Les tokens sont comptabilisés lorsque
l'assistance est utilisée, et restent à zéro sinon. `schemaVersion`
est l'unique version technique du checkpoint. Les métadonnées de canevas et de
catalogue identifient respectivement le document officiel et les correspondances métier.
La [préparation interne](https://github.com/incubateur-ademe/territoires-en-transitions/blob/feat/electrification-plan-import/apps/backend/src/plans/ai-plan-import/electrification/extract-plan/prepare-electrification-import.service.ts)
vérifie les droits avant extraction et la compatibilité du checkpoint à la
reprise, puis relance les résolveurs sur la configuration et les permissions
actuelles. Une reprise compatible réutilise l'extraction et ses interprétations
sans appel au modèle ; un format incompatible bloque explicitement, sans
conversion ni nouvelle extraction automatique.
Le profil n'a pas encore été ouvert en production.
La PR B branche cette préparation au worker et au stockage des jobs ;
l'ouverture reste conditionnée à la qualification complète.

L'[évaluation locale](https://github.com/incubateur-ademe/territoires-en-transitions/blob/feat/electrification-plan-import/apps/backend/src/plans/ai-plan-import/eval/README.md#profil-électrification)
sélectionne ce profil avec `--profile annexe-3-electrification` et utilise la même
assistance automatique pour les cellules éligibles que le parser ne comprend pas.
Si le parser suffit, aucun appel au modèle n'est effectué. Ce parcours pouvant
appeler un modèle payant, son lancement réel est réservé à un humain. Elle
restitue un checkpoint avec `referencesResolved: false`. Sans base, elle ne
qualifie ni les références,
ni les droits, ni les correspondances métier. Les e2e lisent des fichiers DOCX
synthétiques issus du canevas officiel et vérifient les données attendues.
Aucun document réellement rempli n'est disponible à la date de cette révision.
Les vérifications de l’ancien lot 3B sont conservées dans
[l’historique](#historique-des-décisions-et-des-prs) ; la qualification restante
est décrite dans le plan courant.

L'extraction ne choisit aucun identifiant TeT et n'effectue aucun rapprochement
par ressemblance. L'étape de résolution :

- résout les codes dans un catalogue versionné et validé métier ;
- résout les URL TeT reconnues par ID de fiche action, ID d’indicateur
  personnalisé ou identifiant de référentiel, dans le périmètre autorisé de
  la collectivité cible ;
- contrôle la cohérence axe/sous-axe, les unités et les dates ;
- distingue une donnée absente de zéro, et un résultat "Oui" d'un objectif "Oui".

Un code ou une URL fourni mais inconnu, ambigu ou inaccessible bloque
l'import, avec la localisation du champ à corriger. Il n'est jamais converti
silencieusement en élément personnalisé. Un champ de référence vide est
autorisé et désigne un élément personnalisé. Une cible d'engagement vide
reste `null`, avec un avertissement non bloquant.
Le champ "Code ou URL" accepte une référence unique ; plusieurs références
contradictoires doivent être corrigées avant import.

**Vérification du code le 5 novembre 2026.** La mention initiale des UID de
fiches actions était incorrecte pour le modèle actuel : `fiche_action` ne
possède plus cette colonne et le paramètre app `ficheUid` est converti en ID numérique.
Le résolveur reconnaît les routes actuelles et les redirections maintenues
à ID numérique, sans requête HTTP. Une URL avec un ancien UUID est refusée
avec une demande de lien TeT actuel ; aucun mapping de remplacement n'est disponible.
Les origines reconnues sont l'URL de l'app configurée pour l'environnement
et `https://app.territoiresentransitions.fr`.

Une fiche action externe doit être partagée avec la collectivité cible et
accessible avec les permissions ordinaires ; sa seule visibilité publique ne suffit pas.
La collectivité portée par son URL doit aussi être propriétaire ou bénéficiaire
du partage. Pour les indicateurs, la définition est résolue dans le périmètre
visible de la cible (global, propre ou groupement). Les valeurs de la
collectivité portée par l'URL ne sont jamais importées.

Les normalisations génériques ne doivent ni fusionner des fiches distinctes
par leur titre, ni perdre des codes, ni retirer une sous-action identifiée.
Le profil conserve les sous-actions présentes et les conversions oui/non,
même si les options de l'import générique permettent de désactiver leur
extraction. Il ne génère pas d'actions ou de sous-actions supplémentaires,
à l'exception des actions E03/E12 prévues par le contrat métier.

### 3. Un catalogue versionné et une identité indépendante des libellés

Versionner un catalogue limité à ce besoin : axes, sous-axes, engagements,
actions et sous-actions de référence, indicateurs ou jalons oui/non associés.
Le fichier versionné dans Git fait référence pour les correspondances exécutées
par l'import ; les définitions d'indicateurs font référence dans le catalogue TeT
existant. La [configuration Électrification](../../packages/domain/src/plans/plans/electrification.config.ts),
son schéma et son type appartiennent à `@tet/domain/plans`, comme la
[configuration du diagnostic PCAET](../../packages/domain/src/demarches/pcaet/diagnostic/demarche-pcaet-diagnostic.config.ts).
Ils sont réutilisables par les parcours du plan sans dépendre du backend
d'import. Le branchement Nest et les diagnostics documentaires restent dans
l'import ; la validation de la configuration y reste différée à la résolution.
Les traitements propres à ce profil sont regroupés dans
`plans/ai-plan-import/electrification/`, par feature, avec leurs contrats,
règles, erreurs et e2e. Les lecteurs, jobs, contrats documentaires communs et
la résolution générique des URL restent partagés dans `ai-plan-import`.
Le catalogue et les contrats métier restent dans `@tet/domain/plans` ;
l'éligibilité appartient au parcours des plans. Ce regroupement de fichiers
ne nécessite pas de module Nest supplémentaire.
Toute évolution du mapping doit être validée avec le métier, revue
en PR et livrée avec une nouvelle version du catalogue. Une modification d'une
page Notion ou de Grist n'a aucun effet automatique sur l'import.
Ces documents servent à préparer et justifier les décisions. Leurs liens et
relevés datés restent dans l'ADR, hors du contrat et des données du résolveur.

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

**Relevé du 5 novembre 2026.** La colonne Notion "ID et Titre indicateur TeT v2"
donne les références ci-dessous. Leur présence dans cette liste n'atteste
ni leur intégration en base ni la validation de leur définition. Le catalogue
livré garde les périodicités non validées à `null` et les correspondances en
attente de validation ; le résolveur les signale comme erreurs de configuration.
Les fixtures e2e validées vérifient le code, sans valider ces données métier.

| Engagement | `identifiantReferentiel` TeT | Unité de la cible |
| ---------- | ---------------------------- | ----------------- |
| E01        | `part_log_priv_sortie_fioul` | %                 |
| E02        | `part_log_priv_sortie_gaz`   | %                 |
| E04        | `part_log_soc_sortie_gaz`    | %                 |
| E05        | `part_bat_pub_sortie_gaz`    | %                 |
| E06        | `v_particulier_elec`         | %                 |
| E07        | `s_26`, `s_26.a`             | Nombre de bornes  |
| E08        | `autobus_autocar_elec`       | %                 |
| E09        | `nb_artisan_elec`            | Nombre            |
| E10        | `conso_elec_projet_ind`      | MWh               |
| E11        | `conso_elec_projet_agri`     | MWh               |

La résolution des cibles de A vérifie la compatibilité avec leur échéance
annuelle 2030. Elle ne convertit pas une définition mensuelle ou une fréquence
"Ponctuelle" en annuelle. E03/E12 restent des fiches suivies par statut.

Un fichier de données validé et livré avec le backend suffit ; il ne s'agit
pas de construire une bibliothèque de modèles administrable. Les définitions
d'indicateurs restent dans le catalogue existant, alimenté par l'équipe data.
Les associations sont explicites, sans appel à Grist ou Notion pendant un import.
La version interne `electrification-v1` est commune aux engagements et aux
fiches. Elle identifie les correspondances métier livrées avec l'import,
indépendamment de la version du canevas ou de Grist. Les correspondances
non livrées sont représentées par un catalogue `null`. Une liste vide désigne
au contraire un catalogue livré sans entrée. Une entrée d'indicateur `pending`
peut porter une référence TeT ou une unité `null` : son code est connu, mais sa
résolution reste indisponible. Les trois métadonnées (référence, unité et période)
doivent être renseignées avant toute recherche TeT, même si le statut a été
positionné à `validated`. Le résolveur distingue ainsi une correspondance
incomplète d'un code documentaire inconnu.
Le mapping valide aussi les unités et périodicités : pour un indicateur à
deux unités, seule l'unité principale retenue par le métier est importée,
conformément à l'esquisse. Une fréquence "Ponctuelle" du catalogue ne devient
pas automatiquement une périodicité annuelle dans TeT.

**Qualification des données — 10 novembre 2026, lot 7A.** Le relevé du
[Grist V1.3](https://grist.numerique.gouv.fr/o/100te/m4aC9Epwz7ot/Referentiel-dactions-feuilles-de-routes/p/86)
contient 11 axes, 41 sous-axes, 109 actions, 58 sous-actions et 113 indicateurs.
Les 41 numéros de sous-axe sont distincts et leurs références `Axe` désignent
les 11 axes du canevas. Le catalogue `electrification-v1` reprend leurs numéros,
titres et parents explicites. Les titres identiques sous des axes différents
restent des sous-axes distincts. Aucun ID de ligne Grist ni numéro de parent
déduit du titre n'est utilisé comme identité métier.

La [source du catalogue TeT](https://docs.google.com/spreadsheets/d/1im08NvNBGsVb-xB2Lmh-3sgKO7Tje7jUAYQOCNixnuM/edit#gid=347181683),
version déclarée 1.0.125 du 5 novembre, contient désormais les 11 références
chiffrées d'engagement et les composantes `autobus_elec` et `autocar_elec`.
Pour E07, `s_26` et `s_26.a` portent explicitement l'unité "Nombre de bornes"
et la périodicité `annuelle` (lignes 563–564). Ces métadonnées sont également
présentes dans le dump local, ainsi que les dépendances `s_26.b/c/d/e`.
Les deux correspondances E07, déjà confirmées par Émeline, passent à
`validated` dans le catalogue livré. Cela ne confirme pas leur déploiement
actuel dans les environnements cibles ni une équivalence avec `6-a`/`6-b`.

Les neuf autres cibles étaient `pending`, avec une périodicité `null` dans
le code du lot 7A : la colonne correspondante est vide dans la source. Le premier
audit avait exigé une validation supplémentaire ; la relecture ci-dessous
remplace cette interprétation par le défaut annuel documenté. Deux écarts
ont également été relevés ; seul E08 reste à traiter avant ouverture :

- E08 : la formule publiée `opt_val(autobus_elec)+opt_val(autocar_elec)`
  additionne deux parts, chacune rapportée à son propre parc. Deux parcs à
  50 % donnent ainsi 100 %, au lieu de 50 % pour le parc combiné. La formule,
  ses dénominateurs et le périmètre autobus/autocars doivent être validés par
  l'équipe data ; l'import ne les corrige pas.
- E09 : la source TeT utilise `nb`, contre "Nombre" dans la correspondance
  documentaire. Les deux libellés désignent un nombre d'artisans. L'adaptateur
  traduit désormais explicitement "Nombre" vers l'unité canonique `nb` ; ce n'est
  pas un choix métier à rouvrir ni une normalisation générale des unités.

Lors de ce relevé, les correspondances Grist → TeT des indicateurs des fiches
étaient absentes. Les données des 109 actions et 58 sous-actions étaient
disponibles, mais pas encore intégrées. L'absence de code métier pour les sous-actions ne
nécessite pas que le métier en invente : une identité interne stable peut être
attribuée dans le catalogue livré et conservée lors de ses mises à jour.
Le catalogue d'actions et d'indicateurs était alors `null` ; les numéros
d'actions disponibles ne justifient pas d'omettre leurs liens ni leurs compléments.
Lors de ce relevé, l'admission restait fermée, même avec le flag ouvert et une
collectivité éligible. L'exigence d'un catalogue entièrement prêt, même pour
les références non utilisées par un document, était un choix technique ;
les specs ne l'imposent pas explicitement. La décision du 11 novembre
ci-dessous remplace ce contrôle global.

**Relecture des specs et commentaires — 10 novembre 2026.** La
[spec d'import des périodicités du 15 octobre](https://app.notion.com/p/3fa6523d57d7803b950dfbd4bc82e13a)
prévoit explicitement `annuelle` pour une cellule vide du Google Sheets des
définitions. Les neuf périodicités sont donc résolues par ce contrat ; cela
ne valide ni la formule E08 ni la présence des définitions en base. Ce défaut
ne s'applique pas aux deux fréquences explicitement "Ponctuelle" du Grist.

La [tâche de récolte des indicateurs](https://app.notion.com/p/3d66523d57d780d394f6e52a9cd4c9b6)
et le [second Grist Ecolab](https://grist.numerique.gouv.fr/o/ecolabservicesdonnees/49SPrgL9jgVv/Referentiel-dindicateurs/p/264)
ne donnent pas de correspondance complète entre les codes d'indicateurs des
fiches et les identifiants TeT. Le second Grist distingue les points de recharge
de toutes puissances et signale que "station dédiée à la recharge rapide"
ne correspond pas au seuil ≥150 kW ; ne pas assimiler `6-b` à `s_26.a` sur son titre.
Les unités "% et nb" de `1-a`, `1-b`, `1-c` restent sans unité principale
désignée. Les deux indicateurs ponctuels `9.1.1-a` et `11.1.1-a` sont des nombres,
pas des jalons oui/non à convertir en sous-actions.

Lors de cette relecture, l'esquisse prévoyait déjà les aides dans "Documents" ;
la gestion des ressources sans URL restait ouverte. Parmi les 118 ressources Grist, 16 n'ont
pas d'URL ; 15 de celles-ci sont liées à 28 actions distinctes (31 liens).
Les questions restantes
ont été publiées dans les discussions correspondantes, liées en fin d'ADR.

**Intégration du 11 novembre 2026.** A renseigne les neuf périodes annuelles
et l'unité canonique E09, sans transformer une validation `pending` en
`validated`. Dans B, l'adaptateur traduit uniquement la cible principale E09
de "Nombre" vers `nb` ; les autres unités restent contrôlées strictement.
Le checkpoint documentaire garde son unité d'origine et repasse par cet
adaptateur lors d'une reprise, sans nouvelle extraction ni appel IA.

Le catalogue d'actions transporte une liste explicite d'aides, distincte des
moyens humains. Leurs liens HTTP(S) sont préparés par le résolveur de A, puis
ajoutés aux nouvelles fiches dans B via `AddAnnexeService`, dans la transaction
du plan. L'agrégat utilise un contrat générique de documents et déduplique les
URL par fiche ; aucune nouvelle table ni service de documents n'est créé.
Une fiche existante liée par URL ne reçoit aucune aide supplémentaire.

**Décision du 11 novembre 2026 — aides sans URL.** Dans sa
[réponse à 11:19 UTC][decision-aides], Clément propose de ne pas importer les
ressources sans lien. B omet donc ces aides, sans bloquer l'action, et signale
leur omission dans le compte rendu. Leur nom ou description n'est pas ajouté
dans un autre champ pour contourner l'absence de lien. Une URL renseignée mais
invalide reste bloquante et doit être corrigée dans le catalogue par l'équipe.
Cette règle remplace le blocage provisoire décrit dans les relevés ci-dessous.

**Intégration du catalogue d'actions — 11 novembre 2026.** Les six tables
V1.3 ont été relues via l'API publique Grist ; leurs données sont inchangées
depuis le relevé du 10 novembre. Le catalogue livré contient les 109 actions
avec leurs titres, descriptions et rattachements principaux explicites, leurs
58 sous-actions, 89 liens vers 86 indicateurs et 354 liens vers 107 ressources.
Les ressources partagées sont définies une seule fois (titre et URL), puis
réutilisées par les actions. Lors de cette intégration, les 15 ressources liées
sans URL restaient explicites et bloquaient la résolution des actions concernées.
La décision ci-dessus remplace ce comportement dans B. Le décompte de
31 actions mentionné lors du premier audit était un nombre de liens ; il concerne
28 actions distinctes.

Les codes d'action et d'indicateur proviennent des colonnes `Numero` et `Code`.
Les codes internes `sous-action-001` à `sous-action-058` sont attribués une fois
dans les données livrées ; ils ne doivent jamais être recalculés lors d'un tri,
d'un renommage ou d'un changement de parent. Le parent exact du catalogue
continue d'être conservé sur chaque import. Aucun ID de ligne Grist n'est utilisé
comme identité métier. Les thématiques et rattachements secondaires `Aussi_axes`
restent hors du contrat actuel ; ils ne changent pas le rattachement principal
contrôlé par le résolveur. Les ressources Grist ne deviennent pas des moyens humains.

Les 113 codes d'indicateurs sont conservés, tous quantitatifs dans cette source,
avec leurs unités non ambiguës et leurs fréquences explicites : 107 annuelles,
4 trimestrielles et 2 périodes ponctuelles à préciser (`null`). L'unité principale
des trois codes `1-a`, `1-b`, `1-c` reste `null`. Les 113 correspondances restent
`pending`, sans identifiant TeT inventé ; ces données ne créent aucune définition
d'indicateur. Une action dont un complément utilise une correspondance incomplète
échoue en erreur de configuration plutôt que d'omettre cet indicateur. La version
interne demeure `electrification-v1` :
ce catalogue n'a pas encore été ouvert aux imports publics.
Avant la réponse de Clément, une action sélectionnée avec une aide sans URL
produisait un diagnostic de configuration avant création. Ce blocage ne
s'applique plus dans B ; l'omission est signalée sans empêcher l'import.

**Décision du 11 novembre 2026 — validation des références utilisées.** Dans B,
l'admission et la reprise contrôlent l'intégrité du catalogue livré : structure,
identités uniques et rattachements cohérents. Elles n'exigent plus que toutes les
correspondances d'indicateurs et cibles soient validées. Les résolveurs vérifient
chaque référence effectivement utilisée avant la création du plan, y compris
les cibles des engagements retenus et les compléments automatiques des actions.
Une référence inconnue, une correspondance `pending`, une définition TeT absente
ou des métadonnées requises manquantes restent bloquantes ; aucun complément
d'indicateur n'est omis pour rendre l'import possible. Les aides sans URL
sont omises avec un avertissement selon la décision ci-dessus ; une URL
renseignée mais invalide reste bloquante.

Ce changement permet une recette limitée aux références résolubles, par exemple
les engagements de décommissionnement du réseau de gaz et d'identification
d'un site de recharge pour poids lourds (E03/E12), avec l'action d'animation
du réseau des chauffagistes (`1.4.1`). Il ne vaut pas validation des indicateurs
encore en attente. Le flag de création, les droits, l'éligibilité, le type de
plan et la compatibilité des checkpoints sont inchangés. A conserve son
comportement utilisateur actuel ; cet assouplissement appartient à B.

**Décision du 10 novembre 2026 — première version du catalogue.** Les noms
`electrification-v2` du lot 2B2b et `electrification-v3` initialement proposé
en 7A reflétaient les étapes de développement, pas des versions métier
publiées. Ils sont remplacés par `electrification-v1`, conservée jusqu'à la
qualification initiale. Une fois cette référence qualifiée, les changements
de correspondances nécessiteront une nouvelle version et une gestion explicite
des imports en cours. Le contrôle de compatibilité reste strict : les jobs
portant une autre version conservent leur source et leurs checkpoints, sans
reprise automatique sous v1. Vérifier les éventuels jobs de préproduction
avant déploiement ; aucun job n'est réétiqueté par ce changement.
Le contrôle du dump local le 10 novembre n'a retrouvé que des fixtures e2e
Électrification en échec, sans job v1 ni import en cours. La préproduction
actuelle n'a pas été vérifiée.

**Historique du 9 novembre 2026, lot 3B, remplacé le 10 novembre.** Le parser
conservait alors le catalogue `electrification-v2`. Les libellés fixes du canevas appartiennent à l'adaptateur
documentaire, séparément des correspondances métier. L'ajout d'un titre
d'engagement et la version `electrification-v3`, préparés pour le prompt,
sont retirés avant fusion avec l'extraction LLM. Aucune correspondance
métier en attente n'est validée par ce changement de lecture.

La définition du format V4 traduit les lignes du tableau A en codes E01 à E12 :
ces codes ne figurent pas dans le Word et ne sont pas affichés à la collectivité.

| Axe du tableau A                                            | Engagements |
| ----------------------------------------------------------- | ----------- |
| 1. Logements privés : sortie du fioul et du gaz             | E01, E02    |
| 2. Logements sociaux : sortie du gaz                        | E04         |
| 3. Bâtiments publics : sortie du fioul et du gaz            | E05         |
| 4. Réseau de gaz : décommissionnement de certaines portions | E03         |
| 5. Véhicules particuliers électriques                       | E06         |
| 6. Bornes de recharge                                       | E07         |
| 7. Recharge des poids lourds                                | E12         |
| 8. Autobus électriques                                      | E08         |
| 9. Artisans                                                 | E09         |
| 10. Industrie                                               | E10         |
| 11. Agriculture                                             | E11         |

Créer une seule fois chaque axe demandé par un engagement retenu ou par
une fiche action. Un engagement retenu crée son axe même sans fiche ; une fiche
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

Réutiliser `axe`, `fiche_action` et leurs relations, sans nouvelle entité métier.
Les clés de source et les correspondances vers les IDs TeT suffisent à créer
la structure et les liens dans la transaction ; le lot 4A ne modifie pas le
schéma. Pour les indicateurs prédéfinis,
conserver leur `identifiantReferentiel` et leur ID existants.

Le besoin métier reste de retrouver la correspondance ADEME d'un objet après
renommage ou déplacement, en distinguant une action de référence, une
sous-action et un indicateur oui/non converti. Il faut aussi conserver la
sélection explicite de A : E01 et E02 restent distincts malgré leur axe commun,
et les axes demandés par les fiches actions n'ajoutent aucun engagement.
**Décision confirmée en revue le 10 novembre 2026 :**
cette sélection initiale reste conservée même après modification ou suppression
des axes et fiches du plan. Elle ne décrit pas son contenu courant.
Les IDs TeT identifient les objets, mais ne constituent pas à eux seuls cette
correspondance au catalogue ADEME.

**Décision de stockage — lot 4D, 10 novembre 2026.** Les références sont
attribuées aux nouveaux objets par `CreatePlanAggregateService`, sous la
transaction de création. Elles restent hors des DTO publics et des projections
de duplication. Aucune entité d'engagement, cible ou convention n'est ajoutée.

| Table          | Champs ajoutés                                            | Usage                                                                                                                       |
| -------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `axe`          | `reference_programme`, `reference_code`                   | Programme et numéro d'axe/sous-axe issus du catalogue ; indépendants du titre et de la position.                            |
| `axe` racine   | `engagements_codes`                                       | Sélection explicite de A, avec E01/E02 distincts. Une sélection vide est distincte d'un plan ordinaire sans programme.      |
| `fiche_action` | `reference_programme`, `reference_kind`, `reference_code` | Identité d'action, sous-action, indicateur oui/non converti ou fiche d'engagement E03/E12.                                  |
| `fiche_action` | `reference_parent_code`                                   | Code de l'action catalogue parente au moment de l'import, conservé après déplacement dans TeT ou modification du catalogue. |

Le programme métier est distinct du profil technique d'import et de la source
d'indicateurs. Les références sont déjà résolues avant l'attribution ; les
codes ne sont pas reconstruits depuis les titres. Une fiche liée par URL garde
ses références existantes. Plusieurs fiches locales peuvent reprendre la même
action catalogue. Le contrat des sous-actions conserve leur code et celui de
l'action catalogue d'origine. Ce dernier représente leur rattachement au moment
de l'import, indépendamment de la portée de leur identifiant.

**Vérification du catalogue — 10 novembre 2026.** Le
[Grist lié dans la spécification](https://grist.numerique.gouv.fr/o/100te/m4aC9Epwz7ot/Referentiel-dactions-feuilles-de-routes/p/86)
contient 109 actions avec un `Numero` distinct et 58 sous-actions réparties
sur 25 actions. La table `V1_3_Sous_actions` ne possède pas de colonne de code
métier : elle expose un ID de ligne, une référence `Action`, un `Ordre`, un titre
et une description. L'ordre 1 apparaît sous 25 actions ; ce n'est pas une
identité stable. L'ID de ligne est unique dans cette table, conformément à la
[documentation Grist](https://support.getgrist.com/references-lookups/#reverse-lookups).
Le catalogue livré était alors incomplet (`fiches.actions: null`) ; les
codes répétés des tests étaient synthétiques. Ils ne démontraient pas un besoin
d'identification par le parent.

**Décision confirmée en revue le 10 novembre 2026 :** conserver le rattachement
catalogue exact au moment de l'import. L'alternative envisagée, un seul code de
sous-action complété par une lecture du catalogue courant, ne préserve pas ce
rattachement si le catalogue évolue. `reference_parent_code` est donc conservé
pour cette provenance historique, même si la sous-action possède un identifiant
unique dans le catalogue. Il est attribué depuis le catalogue livré lors de
l'import, puis relu tel quel : ni un déplacement dans TeT ni une mise à jour du
catalogue ne le recalculent. Les codes catalogue doivent conserver leur sens et
ne pas être réattribués à d'autres éléments. Cette décision ne fige pas les
libellés ni l'intégralité du catalogue et n'ajoute aucun accès Grist à l'import.

`GetPlanReferencesService` lit les identités depuis les objets actuellement
rattachés au plan et applique leurs droits. Une sous-action suit sa parente
actuelle ; une parente supprimée, détachée ou non lisible exclut ses enfants.
La purge d'un job n'a aucun effet sur ces lectures. Les contraintes SQL vérifient
la forme des références ; un trigger interdit leur attribution par les rôles
publics, y compris via une fonction `SECURITY DEFINER`. Les éditions ordinaires
conservent ces champs. Aucun dashboard ni moteur de reporting n'est ajouté.

La solution préserve ces règles : une édition ordinaire n'attribue pas
de référence, une duplication ordinaire ne copie pas l'identité d'annexe et
un élément libre n'en reçoit pas du fait de sa position. Le reporting devra
utiliser les objets et liens actuels, sans compter les éléments supprimés ou
sortis du plan ni compter deux fois une action de l'axe 1 pour E01 et E02.
Les écarts avec la convention restent traités manuellement par l'ADEME et le
support. Aucun moteur de restauration ou registre conventionnel n'est ajouté.

### 4. Conserver les cibles avec les sources de valeurs existantes

Les cibles du tableau A sont des objectifs datés de la source "Annexe 3
Électrification" dans `indicateur_valeur`. Elles coexistent avec les objectifs
déjà saisis par la collectivité et les autres sources, sans les modifier.
Réutiliser `indicateur_source` et `indicateur_source_metadonnee`. Le besoin
reste d'isoler les cibles de chaque plan, même si deux plans concernent le
même indicateur, la même collectivité et la même année. Les lectures doivent
cibler la métadonnée exacte du plan, pas seulement le nom de source ou sa
version la plus récente.

**Décision de stockage — lot 4D, 10 novembre 2026.** La racine du plan porte
`axe.indicateur_source_metadonnee_id`, nullable, unique et lié par FK à
`indicateur_source_metadonnee`. Ce lien est indépendant des références de
programme. Une source peut ainsi être utilisée par une racine ordinaire, sans
attribuer implicitement des engagements. Une métadonnée appartient au plus à
un plan ; les axes enfants ne portent pas ce lien.

`ManagePlanIndicateurSourceService` crée ou retrouve la métadonnée exacte sous
verrou de la racine. Il réutilise les services de sources de 4B et les lectures
et complétions de 4C. Les méthodes dérivent la collectivité et la métadonnée du
plan stocké, vérifient la source et les droits ordinaires, puis conservent les
verrous jusqu'au commit. L'autorisation `metadataAuthorization` reste interne
à cette transaction. Aucun identifiant fourni dans les valeurs ne remplace
ce périmètre. La lecture verrouillée de la racine et son rattachement à une
source utilisent les repositories de plans existants ; les accès aux
métadonnées restent dans le domaine indicateurs. Les droits de lecture sont
ceux de `GetPlanService`, communs aux autres lectures de plans.

La suppression du plan conserve sa métadonnée et ses valeurs. La FK interdit
de supprimer une métadonnée encore rattachée ; la collectivité d'une racine
sourcée ne peut pas être changée. Une duplication ordinaire ne copie pas le
lien. La migration est additive ; un rollback applicatif garde le schéma et
les données. Le revert SQL est réservé à un schéma encore inutilisé et refuse
d'effacer des références ou rattachements déjà renseignés.

Les écritures et les calculs doivent préserver cette isolation entre plans,
ainsi que les sources existantes. Adapter les règles de regroupement et leurs
tests avant toute écriture annexe, en réutilisant le mécanisme déjà employé
pour les sources PCAET. Cela ne modifie pas les formules du catalogue et ne
permet pas de recalculer une cible saisie comme un résultat. Les droits du
plan et des indicateurs restent vérifiés par les services existants. Le
rattachement de métadonnée n'est pas un droit d'accès supplémentaire.

Pour E06 et E08, la [réponse d'Émeline du 4 novembre 2026](https://app.notion.com/p/3f16523d57d7808ab94ef5f8b79e4c90?d=40d6523d57d78177b5db001c7ef4622d)
remplace les indicateurs d'immatriculations annuelles `part_v_h_im.c` et
`part_v_h_im.ef` par des indicateurs de parc. Les lignes mises à jour dans la
colonne "ID et Titre indicateur TeT v2" donnent les références suivantes :

| Engagement                                                       | `identifiantReferentiel` TeT | Intitulé TeT                                                         | Unité |
| ---------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------- | ----- |
| [E06](https://app.notion.com/p/3d66523d57d7807a8703ef4460177db4) | `v_particulier_elec`         | Part des voitures électriques dans le parc de voitures particulières | %     |
| [E08](https://app.notion.com/p/3d66523d57d780999cded9124716b3ed) | `autobus_autocar_elec`       | Part des autobus et autocars électriques dans le parc roulant        | %     |

E06 porte une cible dans l'axe 5, E08 une cible dans l'axe 8. Pour E08, le
périmètre proposé par l'équipe data couvre les autobus et les autocars ;
son adéquation à l'engagement de l'annexe reste à valider. Émeline prévoit de
s'appuyer sur `autobus_elec` et `autocar_elec` ; la définition et sa formule
relèvent de l'équipe data. L'import lie l'indicateur composé sans recalculer
sa valeur ni créer deux cibles à partir de ses composantes.

Ces identifiants sont confirmés et figurent dans la source des définitions
relue le 10 novembre ; leur présence dans l'environnement cible reste à vérifier.
Avant ouverture, appliquer les correspondances et périodicités déjà documentées,
faire valider les écarts restants avec l'équipe data et le métier, notamment
la formule et le périmètre E08, puis vérifier les définitions et leurs
dépendances de calcul déployées. Ces vérifications restent nécessaires à
l'ouverture. Une définition attendue absente bloque avant création du plan,
avec un diagnostic de configuration à traiter par l'équipe ; la collectivité
n'a pas à corriger une annexe valide. Ne pas créer d'indicateur personnalisé
en remplacement ni utiliser les anciens indicateurs d'immatriculations.

Pour E07, Émeline [confirme le 4 novembre 2026](https://app.notion.com/p/3f16523d57d7808ab94ef5f8b79e4c90?d=40d6523d57d78163bb61001cef0db51c)
deux indicateurs déjà existants dans TeT. La
[ligne E07 de la liste des engagements](https://app.notion.com/p/3d66523d57d78028a8b8f67932311e86)
précise les correspondances à utiliser :

| Cible de l'annexe                                | `identifiantReferentiel` TeT | Intitulé TeT                                                                          |
| ------------------------------------------------ | ---------------------------- | ------------------------------------------------------------------------------------- |
| Nombre total de bornes publiques                 | `s_26`                       | Nombre de bornes de recharge ouvertes au public                                       |
| Nombre de bornes rapides, incluses dans ce total | `s_26.a`                     | Nombre de bornes de recharge ouvertes au public - Station dédiée à la recharge rapide |

Écrire deux objectifs distincts pour E07, chacun sur son indicateur dans
l'axe 6 et sous la métadonnée du plan, avec l'unité "Nombre de bornes". Ne pas
fusionner ni additionner les deux valeurs. Une cible vide reste indépendante
de l'autre. Réutiliser les définitions existantes sans modifier leurs formules
ni les valeurs des autres sources.

Les codes Grist `6-a` et `6-b` désignent des "points de recharge", avec un seuil
de 150 kW pour `6-b`. La confirmation des indicateurs TeT d'E07 ne valide pas
leur équivalence avec ces codes : cette correspondance reste à établir pour
les fiches actions qui les citent. Ne pas convertir des points en bornes ni ajouter
ce seuil aux cibles de l'annexe.

Présenter la source et la cible de l'annexe à partir des lectures d'indicateurs
existantes. Adapter si nécessaire leur sélection et leur affichage pour ne
pas confondre les données de deux plans ou masquer l'objectif de la
collectivité. Une cible absente reste absente et produit un avertissement ;
zéro reste une valeur. Aucun écran de gestion des engagements ni nouvelle
API de registre conventionnel n'est ajouté. La modification de la convention
ne fait pas partie de cette livraison.

Pour E03 et E12, créer une fiche ordinaire sous l'axe concerné avec un statut
initial "À venir". Son identification durable par engagement est livrée en
4D, comme décrit en section 3. "Engagement retenu : Oui" ne
signifie pas "Réalisé". Le suivi utilise ensuite le statut de la fiche.

Supprimer, déplacer ou dissocier les objets reste possible avec les droits
ordinaires. La suppression du plan ne supprime pas les valeurs d'indicateurs
de la collectivité, quel que soit le rattachement de source retenu. Une fiche
supprimée logiquement est exclue du suivi ordinaire. Le support s'appuie sur
la convention d'origine pour les écarts ; le job et son compte rendu gardent
leur rétention ordinaire, sans garantie d'archivage permanent de la convention.

### 5. Créer ou relier sans altérer les données existantes

| Référence dans l'annexe     | Comportement                                                                                                                                                |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Code d'action connu         | Créer une fiche à partir de la référence résolue ; reprendre les champs renseignés de l'annexe et les compléments du catalogue prévus pour cette référence. |
| URL de fiche existante      | Ajouter son rattachement au plan, sans copier la fiche, déplacer ses autres liens ou modifier son contenu, ses sous-actions et ses indicateurs.             |
| Action sans code ni URL     | Créer une fiche libre sous l'axe/sous-axe indiqué.                                                                                                          |
| Code d'indicateur connu     | Lier la définition du catalogue ; ne pas recréer l'indicateur ni écraser des valeurs locales.                                                               |
| URL d'indicateur existant   | Ajouter le lien vers cet indicateur, en conservant tous ses champs, valeurs et liens existants.                                                             |
| Indicateur sans code ni URL | Créer un indicateur personnalisé avec titre, unité, résultat et objectif lorsque renseignés.                                                                |

Le compte rendu signale les données de l'annexe non appliquées aux objets
désignés par URL, pour rendre cette conservation explicite.

**Décision confirmée le 9 novembre 2026.** Les contrôles documentaires
s'appliquent aussi aux champs renseignés d'une fiche désignée par URL : une
date ou un statut invalide bloque l'import avant création du plan. Les champs
valides restent non appliqués et signalés dans le compte rendu. Ces contrôles
portent sur le document, pas sur les valeurs déjà enregistrées dans TeT.

Si une URL et un code ou complément catalogue désignent le même indicateur
dans une fiche action, conserver un seul lien, sans valeurs à appliquer. La résolution
compare les identités TeT, pas seulement les chaînes de référence.

Le profil importe les titres, descriptions, objectifs textuels, structures
pilotes, partenaires, dates, statuts et sous-actions. Les données de l'annexe
priment sur les valeurs de préremplissage du catalogue pour une nouvelle fiche.
Les codes identifient les sous-actions de référence ; une même sous-action
n'est pas ajoutée deux fois depuis le catalogue et l'annexe. Les moyens humains
ne sont repris que s'ils sont effectivement renseignés, sans les déduire du
nom d'une structure pilote. Aucun compte utilisateur n'est créé depuis ces noms.
Le contrat du lot 2B2b résout ces codes dans les sous-actions de l'action de
référence. Le rattachement d'une sous-action codée à une fiche libre reste à
préciser avec les associations du catalogue, avant ouverture ; aucune recherche
globale par libellé n'est ajoutée. Vérifier les dates après fusion des champs
documentaires et de référence : la date de début ne peut pas dépasser la date
de fin.

**Convention confirmée le 9 novembre 2026.** Pour les dates prévisionnelles
et les échéances de sous-actions, un mois et une année deviennent le premier
jour du mois : `06/2028` ou `juin 2028` donnent `2028-06-01`. Ce jour est une
convention de stockage, pas une précision fournie par la collectivité. Une date
complète conserve son jour ; une année seule ou une date invalide est signalée.
Cette règle ne modifie pas les périodes annuelles des indicateurs ni la
conversion des objectifs oui/non en échéances de fin d'année.

Pour les nouveaux indicateurs personnalisés, la V4 fournit un résultat avec
son année et un objectif à 2030. Utiliser la périodicité annuelle de ces données ;
respecter la périodicité fixe d'une définition déjà existante. Une valeur sans
unité ou période exploitable est signalée, jamais affectée à une unité ou date
inventée. Pour un indicateur de catalogue, compléter seulement les valeurs
absentes après validation ; conserver et signaler tout conflit avec une valeur
existante. Le chemin URL reste strictement limité aux liens, même si un champ
de l'indicateur est vide.

Un indicateur oui/non devient une sous-action de `fiche_action`, reliée par
`parentId`, avec son titre conservé. Sa référence devra rester identifiable
selon la solution durable livrée en 4D. Un résultat "Oui" donne
le statut "Réalisé" ; "Non" donne "À venir". Une réponse vide est signalée
et ne constitue pas une réalisation. L'année d'objectif devient une échéance
en fin d'année, explicitement conventionnelle, sans inventer de date réelle
d'achèvement. Ne pas confondre ces sous-actions avec les anciennes étapes de fiche.
Le compte rendu conserve la réponse extraite et sa période d'observation
selon sa rétention ordinaire ; le statut reste le suivi courant de la fiche.
Ne pas recopier le fichier, son hash ou son extraction sur chaque objet créé.

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
Le service commun `PersistPlanIndicateursService` traite un lot ordonné :
revalidation des définitions sous verrou, création ou réutilisation des
indicateurs, liens aux axes et fiches, source du plan et complétion des valeurs.
Son contrat contient des clés de cible, des définitions ou IDs et des valeurs
facultatives ; les conflits sont rattachés à ces clés. Il réutilise notamment
`ManagePlanIndicateurSourceService` pour la source exacte du plan.
Un adaptateur Électrification traduit le catalogue et les cibles A vers ce
contrat, puis les diagnostics vers le compte rendu. Il ne réalise aucune
écriture. Le point d'entrée métier conserve le checkpoint et l'éligibilité.

**Découpage de livraison — 10 novembre 2026.** Le lot 5A compose ces écritures
dans `PersistElectrificationImportService`, sans worker ni admission publique.
Il consomme un checkpoint documentaire, revalide les références et préserve
les valeurs existantes. Une autorisation interne lie la création du vrai type
Électrification à l'utilisateur, à la collectivité et à la transaction après
contrôle d'éligibilité. Elle ne permet ni conversion d'un plan existant ni
contournement par les parcours ordinaires. Les services partagés consomment
uniquement `PlanCreateAuthorization`, qui vérifie ce périmètre. Sa délivrance
après contrôle d'éligibilité et sélection du type exact reste dans
`ElectrificationImportAuthorization`, dans le dossier de l'import Électrification.
Le lot 5B raccorde le pipeline,
l'admission et la reprise ; il appelle la persistance avec sa transaction et
y enregistre aussi le compte rendu et la réussite du job. La persistance seule
ne constitue pas une opération de reprise idempotente.

**Livraison du parcours app — lot 6, 10 novembre 2026.** Le blocage temporaire
est remplacé par le flag serveur `is-electrification-plan-creation-enabled`.
Il couvre la création manuelle, l’import Excel, la duplication, le passage d’un
autre type vers Électrification et l’admission de nouveaux imports dédiés.
Son activation explicite est obligatoire ; absence, erreur d’évaluation et
désactivation ferment ces parcours, y compris en dev/test/CI et pour le
super-admin. Cette clé remplace `is-electrification-plan-import-enabled` sans
repli : une ouverture PostHog doit cibler la nouvelle clé.

**Décision du 11 novembre 2026 — ciblage de la recette.** Réutiliser le
ciblage par groupe `collectivite` du flag de contournement du diagnostic
PCAET : une liste explicite de `collectivite_id`, sans contexte d'environnement.
Le serveur transmet déjà la collectivité à l'évaluation et l'interface utilise
ses capacités ; aucun changement du tracker commun n'est nécessaire.
Le projet PostHog étant partagé, une collectivité ciblée l'est en préproduction
et en production dès que ce code y est déployé. Cette ouverture limitée ne
vaut pas ouverture générale et conserve les contrôles de droits, d'éligibilité
et de catalogue. Le réglage opérationnel est décrit dans le
[plan de déploiement](../plans/2026-11-04-001-feat-import-annexe-3-electrification-plan.md#déploiement-de-b-et-ouverture).

Lorsque le flag est ouvert, les droits ordinaires permettent de créer un plan
Électrification, y compris pour une collectivité non lauréate, sans initialiser
d’engagements ni de cibles de convention. L’import dédié exige en plus
l'éligibilité, l'intégrité du catalogue et des correspondances complètes pour
les références utilisées ; le profil IA générique continue de refuser ce type.

La fermeture préserve la lecture, l’édition et la suppression des plans
existants, y compris une sauvegarde qui conserve leur type Électrification.
Les imports déjà admis peuvent terminer et reprendre. Leur autorisation
interne `PlanCreateAuthorization` est conservée, liée à l’utilisateur, à la
collectivité, au type exact et à la transaction ; elle n’est pas une option
des API publiques. `ElectrificationImportAuthorization` garde le contrôle
d’éligibilité et le verrou du type exact. Le contrôle commun de création
consomme cette autorisation sans connaître les règles du programme.

L’interface lit les capacités de création du serveur et ne connaît que les
identifiants de types indisponibles. La liste complète des types reste
accessible pour lire les plans existants. Aucun contrôle du navigateur ne
remplace le refus côté serveur.

Le contrat public des profils est partagé dans `@tet/domain/plans`. L’app
sélectionne le profil selon le type exact, affiche le DOCX officiel V4 comme
seul format pour Électrification et impose la conservation des sous-actions.
La capacité serveur positive reste obligatoire, indépendamment du flag UI
historique et du mode super-admin. Une API sans cette capacité n’affiche pas
ce choix. Le suivi et le compte rendu ajoutés dans B restent accessibles après
fermeture de l’admission.

La lecture ordinaire du plan expose sa métadonnée de source exacte. Les cartes
d’indicateurs d’axe montrent la cible de l’annexe séparément de l’objectif
local, avec son unité et son échéance. Elles ne prennent aucune cible d’une
autre métadonnée et suivent les liens actuellement présents dans le plan.
L’affichage spécifique reste dans les composants Électrification. `PlanView`
le compose via le contexte existant : les axes et le graphique reçoivent
uniquement des options d’affichage neutres. Le formulaire commun applique
les options d’extraction fournies par la configuration du profil ; leurs
valeurs imposées restent dans le module Électrification.
L’ouverture en production reste conditionnée à la
qualification complète décrite dans le plan.

**Décision de stockage du compte rendu — lot 5B, 10 novembre 2026.**
Réutiliser la colonne JSON `draft` du job avec un membre `report`, sans nouvelle
colonne ni table. Le compte rendu structuré est exposé séparément par l'API ;
les jobs génériques historiques conservent leur restitution actuelle. La purge
des checkpoints techniques ne touche pas ce compte rendu. Le checkpoint
documentaire reste exclu des projections de suivi.

Les messages affichés dans l'historique et le compte rendu sont définis dans
les fichiers `.errors.ts` concernés, avec leur formatage lorsqu'ils comportent
des paramètres. Les services réutilisent ces définitions ; les codes de
diagnostic et les motifs de télémétrie restent distincts des textes affichés.

**Retours de recette du 11 novembre 2026 — [TT-67][retours-tt67].** Simplifier
le texte d'upload vers "Annexe 3 de la convention signée sur Word". Le format
DOCX et la limite de taille restent contrôlés ; ce libellé ne signifie pas que
l'import vérifie une signature. Employer "action" dans l'interface d'import,
y compris les étapes de progression, sans renommer les entités techniques
`Fiche` du domaine.

Une relance destinée à corriger le document conserve le titre, le type et les
options du formulaire, puis permet de remplacer le fichier. Elle crée un nouvel
import ; la reprise d'un même job conserve sa source, ses options et ses
checkpoints selon le contrat existant.

Dans le détail d'import, afficher une erreur une seule fois, avec une correction
concrète : numéro à vérifier, année de référence à renseigner ou champ à
compléter. Localiser les diagnostics avec l'action, l'engagement, l'indicateur
ou la sous-action concernés plutôt qu'avec les coordonnées internes d'un
tableau Word. Une configuration manquante ou non validée relève de l'équipe ;
le message ne doit pas demander à la collectivité de corriger son document
quand celui-ci n'est pas en cause.

La suggestion d'afficher toutes les erreurs du document en une fois reste
une piste produit à préciser. Ce lot améliore la restitution des diagnostics
disponibles et ne promet pas une validation exhaustive en un seul passage.

`ValidateImportProfileService` porte les droits communs et le dispatch des
profils. Les règles métier sont regroupées dans
`ValidateElectrificationImportService`, sous `electrification/validate-import/` :
disponibilité, admission, format DOCX et revalidation des jobs existants.
Les règles de compatibilité du catalogue, du canevas et du checkpoint restent
dans ce même dossier. Le repository appelle le validateur de profils, y compris
sur la ligne verrouillée avant reprise ; il ne connaît ni catalogue ni schéma métier.
L'enfilement consomme les options validées et la décision de créer un plan
provisoire ; il ne connaît pas les règles Électrification. La reprise et le
worker réutilisent la même autorisation métier.
L'admission exige le flag serveur de création, fermé par défaut, les droits ordinaires,
l'éligibilité, le type exact et un catalogue structurellement valide. Les
correspondances utilisées sont ensuite contrôlées avant toute création. Ce flag
n'hérite ni de l'activation automatique en dev/test/CI ni d'un contournement
super-admin. Sa fermeture empêche toutes les nouvelles créations du type
Électrification, dont les nouveaux imports ; les jobs admis et
leurs reprises continuent, sous réserve de droits, d'éligibilité et de contrats
toujours valides. Le support relance le job au nom de son demandeur initial.
Le service métier demande une évaluation explicite du flag via l'option commune
`requireExplicitActivation: true`, y compris en dev/test/CI. Le tracker ne
contient aucune exception par nom de fonctionnalité ; le bypass PCAET utilise
la même option.

Les générateurs partagent le même contrat de résultat et d'échec, préparé
dans A. Le générateur Électrification traduit ses diagnostics vers ce contrat ;
l'orchestrateur commun sélectionne le profil et gère le cycle de vie.
Le profil générique et le profil PCAET distinct de B utilisent le même moteur
multiformat. La politique PCAET pilote les secteurs ; les anciens jobs
`generic` conservent leur option `withSecteurs` à la reprise. La complétion
des secteurs garde son exécution après commit.
Les types communs composent les options et checkpoints des profils sans définir
les règles métier Électrification ni modifier leur représentation JSON.

Vérifier les droits d'import, de création d'indicateurs et de liaison des
objets résolus, puis les revérifier au moment des écritures. Une URL ne donne
aucun droit supplémentaire : une fiche d'une autre collectivité nécessite
le partage et les permissions ordinaires permettant sa liaison. Les liens
sont ajoutés, jamais remplacés par la seule liste issue de l'annexe.

Le plan, ses axes, les nouvelles fiches, les liens, les indicateurs créés,
leurs valeurs et la métadonnée de source sont enregistrés avec la réussite du job.
Tout échec annule ces écritures. Conserver le contrôle `status`/`attempt`
existant pour empêcher un ancien worker de valider après une reprise.
Le passage est aussi conservé dans les données du job BullMQ : un événement
d'échec tardif reste limité à son `attempt` et ne peut pas modifier le passage
suivant.
Les notifications de réussite et autres effets externes ont lieu après le
commit ; leur éventuel échec ne relance pas la création des données.
Le lot 4A a séparé les webhooks de l'agrégat ; 5B les déclenche seulement
après la validation effective du job.

Une reprise technique réutilise le même job et les checkpoints compatibles ;
elle ne crée pas un second plan. Un nouvel import n'est pas une mise à jour
de convention : conserver l'avertissement existant sur les fichiers déjà
importés et ne pas proposer de fusion ou de synchronisation. Un document
corrigé après validation métier passe par un nouvel import explicitement
distingué d'une reprise ; le remplacement d'un plan existant relève du support.

## Périmètre et dépendances

La livraison principale comprend l'import, les identités de référence,
les engagements, les indicateurs et le respect des données existantes.
Elle réutilise les entités existantes. La conservation durable des identités
ADEME, de la sélection du tableau A et du rattachement des sources au plan est
reprise dans B avec sa migration et les services qui les utilisent. La PR A
ne modifie pas le schéma ; ses refactorings et primitives transactionnelles
préservent les contrats des chemins d'écriture actuels. La revue de la
migration reste distincte dans B : les décisions de stockage ne sont pas
abandonnées par le regroupement des PRs.
Les documents de travail sont identifiés : Grist pour les références d'actions
et leurs indicateurs, la table Notion pour les propositions de correspondances
d'engagement. Seules les correspondances validées et livrées dans le catalogue
versionné sont utilisables par l'import, avec les définitions existantes de TeT.
L'intégration des définitions manquantes, la validation des
correspondances encore ouvertes et celle des lauréats avec les collectivités
TeT restent des dépendances, pas des données à déduire par l'IA. L'alimentation
du catalogue d'indicateurs reste à la charge de l'équipe data ; les définitions
déjà présentes, notamment les deux indicateurs d'E07, sont réutilisées.

Un mapping lauréat–collectivité absent, obsolète ou ambigu rend le profil
indisponible pour la collectivité et bloque l'enfilement, avant toute création
de plan, avec un diagnostic de configuration. Il ne justifie aucun rapprochement
par ressemblance. Conserver la source et la version du mapping utilisées pour
la décision d'éligibilité ; les jobs admis les enregistrent dans leur provenance.
Une collectivité absente du mapping livré n'est pas autorisée à importer.
Cela ne conclut pas qu'elle n'est pas lauréate : son rattachement peut encore
être en attente. Ce refus reste distinct d'une configuration manquante.

Le [mapping versionné](../../packages/domain/src/plans/plans/electrification-laureats.config.ts)
représente les correspondances utilisables de la dernière liste disponible,
distinctes du groupe de déploiement. B y ajoute l'entrée de démonstration
explicitée ci-dessous. Il déclare sa source, sa version et
`validFrom` ; `validUntil: null` signifie qu'aucune expiration n'est prévue.
Une borne de fin renseignée reste exclusive et contrôlée. Le service ajoute
`checkedAt` à la décision. Les jobs conservent cette provenance et une reprise
revérifie l'éligibilité courante sans remplacer la décision d'admission d'origine.
Un même lauréat ou une même collectivité présent plusieurs fois rend le
mapping ambigu. Aucune correspondance n'est calculée par nom à l'exécution.

**Décision du 11 novembre 2026 — intégrer la liste disponible.** À la demande
d'Émilien, l'intégration n'attend plus une liste corrigée exhaustive. La source
est le fichier du 30 septembre ci-dessous, relu le 11 novembre sans changement.
Les références stables viennent de la colonne `id` du fichier du 8 septembre,
pas du numéro de ligne du fichier enrichi. Sur les 109 lauréats, 77 correspondances
(72 EPCI et 5 communes) sont livrées après vérification dans le dump local :
SIREN exact, code officiel supplémentaire pour les communes, et nom cohérent.
Libournais est corrigé vers TeT `4323`, Terre de Provence vers `3980`, à partir
de leur identifiant officiel dans le fichier d'origine. Les fichiers bruts,
qui contiennent des contacts, ne sont pas embarqués.

Émilien confirme de conserver provisoirement le porteur indiqué pour les
groupements, sauf erreur déjà identifiée. 28 porteurs sont donc repris tels
qu'indiqués par le fichier du 30 septembre, sans les présenter comme une
validation définitive du périmètre. Quatre groupements restent exclus :
Pays Lédonien pointe vers CC du Doubs Baumois (`4157`), Pays-du-Bocage vers la
commune de Pontorson (`1725`), et SCOT Périgord Vert et SIEDS n'ont aucune
correspondance dans le dump. Les deux premiers rattachements ne correspondent
pas aux périmètres publiés du [Pays Lédonien](https://www.ccportedujura.fr/contrat-dobjectif-territorial/)
et du [Pays du Bocage](https://petr-paysdubocage.fr/petr-du-pays-du-bocage/).
La liste livrée compte ainsi 105 lauréats.
Ces quatre cas n'invalident pas les correspondances utilisables. Les corrections
suivantes mettent à jour le mapping et sa version ;
elles ne déplacent aucun plan ni aucune donnée déjà créés.

Cette décision remplace l'exigence précédente de conserver tout le mapping
à `null` jusqu'à validation complète. La source n'indique pas de date de fin ;
Émilien confirme que la liste reste active jusqu'à remplacement, sans expiration
automatique. Elle reste révisable, et la
vérification du dump ne remplace pas celle de l'environnement cible. Les
questions sur le responsable de la liste et les porteurs restent ouvertes.

**Décision du 11 novembre 2026 — collectivité de démonstration.** Émilien
autorise l'import dédié pour la collectivité `5460` afin de préparer la recette.
B ajoute la référence synthétique `demo-5460` au mapping existant : 105
correspondances métier et une entrée de démonstration. Cette dernière ne
provient pas de la liste officielle et ne constitue pas une attribution du
programme ; A conserve ses 105 correspondances. Les droits, le flag ciblé
et les contrôles du document restent requis. L'admission de cette collectivité
devient possible après déploiement de B et configuration du flag.
Le 11 novembre, le [flag créé par Émilien](https://eu.posthog.com/project/12975/feature_flags/355720)
est vérifié actif pour la seule collectivité `5460`, selon le ciblage par
groupe prévu. La [recette navigateur](#recette-navigateur-du-11-novembre-2026)
réussit après mise à jour d'un ancien worker, puis couvre E07, un indicateur
personnalisé, une fiche existante et le refus d'une date invalide.
Le ciblage partagé entre
préproduction et production décrit plus haut s'applique aussi à cette entrée.

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
- **Extraire le formulaire V4 par LLM** apporte une tolérance aux présentations
  différentes, mais ni le besoin de cette tolérance ni sa fidélité ne sont
  établis sur des documents remplis. Une valeur incorrecte mais conforme au
  schéma ou une fiche omise peuvent échapper aux validations. Le parser du
  canevas officiel est retenu ; il devra être adapté aux variantes observées.
- **Un fallback IA sur toutes les erreurs** est écarté : il confondrait une
  formulation non reconnue avec une donnée invalide ou une structure inconnue.
  L'assistance retenue est automatique et limitée aux valeurs
  numériques en prose. Elle ajoute un appel externe et des contrôles de preuve ;
  son bénéfice doit être évalué avant l'ouverture du profil en production.
- **Recréer les fiches et indicateurs désignés par URL** produit des doublons
  et sépare l'historique de suivi ; conserver les objets existants.
- **Écrire la cible dans l'objectif courant de la collectivité** peut écraser
  une saisie locale. Une métadonnée de source propre au plan permet leur coexistence.
- **Créer un modèle d'initialisation, d'engagements et de cibles** ajoutait
  une gestion conventionnelle absente du cadrage. Cette proposition est retirée
  le 5 novembre 2026 ; les objets existants portent les données de l'import.
- **Verrouiller le plan ou développer un moteur générique de modèles** ajoute
  un fonctionnement que le cadrage actuel ne demande plus.

Le choix réutilise l'infrastructure d'import et les entités existantes. Les
évolutions du schéma pour les références durables et le rattachement de source
sont regroupées dans B avec leur code consommateur ; la migration fait
l’objet d’une revue explicite distincte des parcours. Elles ne créent
pas de registre métier dans le stockage technique des jobs. L'isolation des
sources par plan demande une validation, notamment pour les calculs. La liberté
d'édition rend possibles les écarts au plan initial ; leur contrôle relève
de l'ADEME et du support à partir des conventions, sans nouveau registre.

## Historique des décisions et des PRs

Les révisions suivantes expliquent les choix conservés et les propositions
retirées. Les numéros de lots renvoient au découpage antérieur, remplacé le
10 novembre 2026 par A/B. Les contraintes métier et de conservation des données
restent applicables.

**Révision du 5 novembre 2026.** Le rappel du cadrage du kickoff par le porteur
de l'implémentation conduit à retirer le modèle proposé d'initialisation,
d'engagement et de cible, ainsi que les deux tables de provenance préparées
dans la [PR #5722](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5722).
Ces cinq tables traduisaient une proposition technique de cet ADR, pas une
exigence de Notion. Elles sont remplacées avant fusion par la réutilisation des
axes, fiches, indicateurs et sources de valeurs existants. Les validations de
la première version de cette PR portaient sur le modèle retiré ; elles ne
valident pas la solution révisée.

La proposition intermédiaire d'ajouter `plan_action_type.code` est également
retirée. Les types ne sont pas renommables par les collectivités ; le risque
évoqué de changement de libellé ne justifie pas une nouvelle colonne. Comme
pour le PCAET, l'identification repose sur le couple existant `(categorie, type)`.

**Révision du 9 novembre 2026 : extraction déterministe.** Le canevas Word V4
[lié dans l'esquisse](https://app.notion.com/p/3f16523d57d7808ab94ef5f8b79e4c90#40d6523d57d780f38027d5d46fd19af5)
exige de respecter sa structure et de conserver les cellules grises. Le porteur
confirme qu'aucun document réellement rempli n'est encore disponible.
L'hypothèse de documents librement remaniés ne justifie donc pas une extraction
LLM par défaut. Le profil est limité au DOCX officiel V4, lu de façon déterministe,
sans fallback IA. Les contrats métier et les résolveurs sont conservés.
La première version de #5759 utilisait un LLM avec des tests simulant ses réponses :
ces vérifications protégeaient les contrôles autour de l'extraction, sans mesurer
la fidélité du prompt. Elles ne valident pas le parser qui les remplace.
Les fixtures synthétiques du canevas qualifient seulement les variantes testées ;
les premiers documents réels devront être vérifiés dès leur disponibilité.
Cet ADR reste proposé ; cette révision remplace sa proposition d'extraction LLM.

**Révision du 9 novembre 2026 : assistance IA ciblée.** Le porteur
autorise ensuite une aide à l'interprétation de certaines valeurs numériques
rédigées en langage naturel. Cette décision remplace l'exclusion de tout appel
au modèle, sans rétablir l'extraction globale par LLM. Le parser intervient
d'abord ; l'assistance intervient automatiquement lorsqu'il ne comprend pas une
cible d'engagement ou une valeur numérique d'indicateur éligible. Aucune option
supplémentaire n'est demandée à l'utilisateur. La structure, les références et
les règles métier restent déterministes. Sans document
réellement rempli ni évaluation de fidélité, aucun gain de fiabilité n'est établi
et le profil reste fermé en production jusqu'aux phases d'intégration et de
qualification.

**Révision du 9 novembre 2026 : version du checkpoint.** Avant la première
livraison, les versions techniques de contrat et de schéma proposées pour
Électrification sont réunies en une seule : `schemaVersion: 1`. Elle protège
la reprise contre un changement incompatible de format ou d'interprétation.
La V4 identifie le canevas officiel ; la version du catalogue identifie les
correspondances métier. Les contrats génériques déjà livrés restent inchangés.

**Révision du 10 novembre 2026 : séparer la revue de la persistance.** La proposition
de sept colonnes de référence sur `axe` et `fiche_action`, préparée dans la
[PR #5774](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5774),
est retirée de cette PR avant fusion. Le lot 4A reste centré sur la structure,
les liens et les effets après commit, sans migration. Les identités ADEME,
les engagements retenus et le rattachement plan–source sont regroupés dans
une PR 4D dédiée, avec les évolutions minimales du schéma existant qui seront
justifiées par leurs usages. Les sept colonnes initiales et la proposition de
lien plan–métadonnée ne sont pas automatiquement reconduites.
Le refus général de modification du schéma, formulé dans une révision
intermédiaire de cet ADR, est remplacé par ce découpage pour faciliter la revue.
La contrainte reste de ne pas créer de nouvelle entité métier d'engagement,
de cible ou de convention. Le lot 4D livre ses migrations éventuelles avec
les écritures, lectures et validations qui les utilisent, avant la phase 5.
Les vérifications de la version initiale de #5774 ne valident pas cette
future livraison.

**Regroupement du 10 novembre 2026.** Le porteur demande deux PRs : une
première sans changement de comportement utilisateur, puis le reste. Cela
remplace l'ordre de fusion de la stack ; les anciennes PRs ci-dessous ne
sont pas fusionnées au moment du regroupement. Leurs remplaçantes sont
[#5812][pr-foundations] et [#5813][pr-import] ; les anciennes PRs restent
consultables pour l'historique de review.

Le socle de contrats et d'API de suivi
[#5702](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5702),
fusionné le 4 novembre, appartient déjà à `main`. Son ancienne recette du
parcours générique en préproduction ne qualifie pas le profil Électrification.

| Lot historique | PR                                                                                | Contenu repris                                  | Livraison actuelle                                            |
| -------------- | --------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------- |
| 1B             | [#5709](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5709) | Historique et suivi des imports                 | B                                                             |
| 2A             | [#5722](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5722) | Identification du type existant                 | B                                                             |
| 2B1            | [#5730](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5730) | Contrats et catalogue des engagements           | A                                                             |
| 2B2a           | [#5736](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5736) | Résolution des URL TeT et éligibilité           | A                                                             |
| 2B2b           | [#5756](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5756) | Codes et compléments des fiches                 | A                                                             |
| 3A             | [#5757](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5757) | Liens et localisations documentaires            | B                                                             |
| 3B             | [#5759](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5759) | Parser du canevas et assistance IA ciblée       | B                                                             |
| 4A             | [#5774](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5774) | Structure, liens et effets après commit         | B                                                             |
| 4B             | [#5775](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5775) | Indicateurs sous transaction commune            | A pour les primitives ; B pour leur intégration               |
| 4C             | [#5778](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5778) | Complétion des valeurs et isolation des sources | B                                                             |
| 4D             | [#5780](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5780) | Références durables et migration additive       | B                                                             |
| 5A             | [#5788](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5788) | Persistance transactionnelle du plan            | B                                                             |
| 5B             | [#5802](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5802) | Pipeline, admission et reprise des jobs         | A pour les refactorings ; B pour les profils et raccordements |
| 6              | [#5806](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5806) | Parcours app, cibles et flag de création        | A pour l’option de tracking ; B pour les parcours             |
| 7A             | [#5811](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5811) | 41 sous-axes et métadonnées E07                 | A                                                             |

**Preuves techniques historiques du 10 novembre 2026.** Le lot 7A a passé
67 tests e2e de résolution et d'admission HTTP, avant l'alignement de la
version du catalogue sur v1. Les 41 sous-axes et leurs parents ont été
comparés au Grist publié ; les deux métadonnées E07, à la source TeT.
Compilation du domaine, typage des tests backend, lint et formatage ciblés
étaient passés. Après l'alignement sur v1, un contrôle direct des règles a
vérifié les contrats v1, le refus des autres versions et le catalogue toujours
incomplet ; compilation, lint et formatage ciblés étaient passés à nouveau.
Ces résultats ne prouvent ni le déploiement des données ni la réussite des
checks de A/B. Les tests des autres lots sont documentés dans leurs PRs ;
les résultats retirés avec un ancien modèle ne valident pas son remplacement.
Aucun de ces tests automatisés ne lançait un modèle externe réel.

**Vérifications du premier regroupement — 10 novembre 2026, avant élargissement.**
La première composition de A a passé 187 e2e sur base locale : 148 tests de
résolution/éligibilité et 39 tests des parcours existants. Ses nouveaux services
n'étaient alors pas appelés par les parcours publics. La première composition
de B a passé 396 tests backend répartis sur 14 suites et 18 tests frontend.
Les fixtures de quota isolaient les jobs du dump ; les tests concernés ont été
réexécutés après correction. Builds et typages ciblés, vérification SQL en
lecture seule et revert sur le schéma local inutilisé après nettoyage des
fixtures étaient passés. Les changements récents de `main`, dont SNBC 3,
étaient conservés. Ces résultats n'incluent ni recette navigateur en
préproduction, ni appel à un modèle externe, ni validation métier manquante.

**Élargissement du regroupement — 10 novembre 2026.** A reprend aussi la
séparation coordinateur/générateur, la finalisation commune dans la transaction
appelante, l'enum public inchangé, la politique PCAET interne, les erreurs et
options partagées, ainsi que les primitives transactionnelles d'indicateurs.
Ces refactorings sont utilisés par le code actif ; le critère est la conservation
du comportement, pas l'absence d'appel. B garde les évolutions fonctionnelles
et ajoute un profil public PCAET distinct avec le moteur multiformat commun.
La reprise des anciens jobs `generic` est requise. Les 187/396/18 résultats
ci-dessus décrivent la composition précédente ; la nouvelle composition doit
être vérifiée et ses résultats consignés séparément dans le plan.

**Vérifications de A élargie — 10 novembre 2026.** Le build Nx du domaine
et le build Nest du backend passent, ainsi que le typage des specs backend,
le lint des fichiers TypeScript modifiés ou créés, 47 tests unitaires et 221 e2e
sur dix suites. Le parcours complet inclut deux cas de
rollback si la finalisation du plan ou du job échoue. Le test PCAET modifié
vérifie l'activation explicite du bypass diagnostic. Sa suite supplémentaire
compte trois succès et onze échecs liés à huit définitions d'indicateurs
absentes du dump local ; elle reste à rejouer sur une base complète. La comparaison
avec `main` confirme l'absence de changement du frontend, du SQL, des lecteurs
de documents et des calculs d'indicateurs. La CI du commit `5938e7d5fe` est
verte, dont les tests backend et navigateur sur la base CI complète.
B a été reconstruite sur ce socle. Sa validation backend comporte 404 tests
sur 14 suites, dont 386 e2e et 18 tests documentaires, complétés par 73 tests
unitaires de génération/worker/admission et 18 tests frontend. Les builds et
typages domaine/backend/API/app/e2e passent. Le deploy, le verify et le revert SQL passent. La suite navigateur d'import
compte 15 succès et un échec intermittent de fermeture/réouverture PCAET ;
ce scénario a ensuite passé cinq relances tracées sans modification.
La cause reste non démontrée et le test conserve ses attentes. La CI et la
recette de préproduction de B restent requises. Aucun modèle réel n'a été appelé.

**Vérifications des périodes, unités et aides — 11 novembre 2026.** A seule passe ses
105 e2e de résolution (45 engagements, 60 fiches), ses builds domaine/backend,
le typage des specs et le lint ciblé. La comparaison avec `main` confirme
l'absence de changements du frontend, du SQL, des lecteurs et des calculs.
Sur B, les cinq suites
e2e ciblées passent : engagements (45), fiches/extraction (142), agrégat (39),
persistance (8) et parcours complet (11), soit 245 tests. Les 16 tests unitaires
existants de l'agrégat passent également, ainsi que les builds domaine/backend,
le typage des specs et le lint ciblé. Les fixtures du parcours complet simulent
aussi l'upload Storage ; les contrôles de bibliothèque restent réels.
Les tests utilisent une copie isolée du dump local et un modèle IA simulé.
Les résultats plus larges du 10 novembre restent historiques ; ni la recette
navigateur ni l'ouverture en production ne sont requalifiées par ces contrôles.

**Vérification de la liste lauréats — 11 novembre 2026.** Après son intégration,
les 21 e2e d'éligibilité passent sur A : droits, configuration absente ou invalide,
rattachements uniques, corrections sourcées et fenêtres avec ou sans date de fin.
Les builds domaine/backend, le typage des specs, le lint ciblé et les liens locaux
des documents passent. Les tests utilisent une nouvelle copie isolée du dump,
un modèle simulé et un worker d'import désactivé. Les suites précédentes ne sont
pas relancées pour cet ajustement ; les IDs restent à vérifier en préproduction.

**Vérification du catalogue d'actions — 11 novembre 2026.** La comparaison
avec les six tables Grist confirme les titres, descriptions, parents et liens
de toutes les entrées livrées. Les 111 e2e ciblés passent sur A (66 fiches et
45 engagements), ainsi que les builds domaine/backend, le typage des specs,
le lint ciblé et les liens locaux. Les cas réels vérifient les compléments de
l'action `1.4.1`, la priorité du titre documentaire et le refus d'omettre
l'indicateur `pending` de `1.1.2`. Une correspondance marquée `validated` mais
incomplète reste refusée avant toute recherche TeT. La base de test isolée
reprend le dump local sans les données volumineuses de `score_snapshot` ;
les modèles sont simulés et les workers d'import désactivés. Ces contrôles
ne valident pas les correspondances métier encore en attente.
Après rebase de B, les 148 e2e de fiches/extraction passent également, ainsi
que le build backend et le typage des specs. Les ajouts de tests propres à B
sont conservés ; aucune recette navigateur n'a été relancée pour ce lot de données.

**Vérification de l'admission ciblée — 11 novembre 2026.** Les 148 e2e de
fiches/extraction et les 14 tests du parcours complet passent, dont l'import
E03/E12 et `1.4.1` avec le catalogue livré. Un complément indicateur `pending`
ou une cible sélectionnée non validée échoue sans créer de plan, fiche ou valeur.
Les 25 e2e HTTP d'admission passent après isolation du stockage dans leur fixture :
les trois cas de quotas génériques nécessitaient le stockage Supabase local,
arrêté pour cette validation. Les JWT de test sont signés localement ; les guards,
permissions et quotas utilisent leur code réel. Le build backend et ses dépendances,
le typage des specs, le lint/formatage ciblés et les liens locaux passent.
L'exécution utilise la base isolée, une IA simulée et des workers désactivés.
Aucun test navigateur, déploiement ni changement de flag n'est effectué.

### Recette navigateur du 11 novembre 2026

Sur la collectivité de démonstration `5460`, un administrateur sans mode
super-admin accède au formulaire Électrification, limité aux fichiers DOCX.
Les formulaires générique et PCAET proposent toujours les quatre formats
attendus et le choix d'import des sous-actions. Le DOCX synthétique contient
E03/E12 et l'action `1.4.1`, sans cible chiffrée ; le résultat attendu est
un plan avec six fiches, dont les trois sous-actions du catalogue.

Émilien lance manuellement le
[job de recette](https://preprod-app.territoiresentransitions.fr/collectivite/5460/plans/importer-ia?importJobId=00333f4b-32b3-45af-bc5e-1d575c6e846c),
admis avec le profil `annexe-3-electrification`. Il termine en échec à
01:19:38 UTC, avec `createdPlanId: null`, après avoir suivi le pipeline générique.
Le message indique que la création d'un plan Électrification est indisponible.

Les [logs PostHog](https://eu.posthog.com/project/12975/logs) du job identifient
le worker `bf829f91d`, alors que les endpoints `/version` de l'app et de l'API
préprod annoncent `053f01f78`. Le
[backend de test préprod](https://test-preprod-backend.koyeb.app/version)
annonce précisément `bf829f91d`, déployé le 5 novembre. Le workflow backend
configure ce service avec les mêmes DB et Redis que le backend préprod normal,
sans préfixe de queue distinct. Un ancien worker a donc consommé le nouveau
profil. Cette exécution ne valide pas l'extraction ni la persistance dédiées.

Avant une nouvelle recette, mettre à jour ou arrêter les anciens consommateurs
de la queue, y compris les backends de test. Aucun nouvel import n'a été lancé
automatiquement et aucune modification d'infrastructure n'a été effectuée.

**Second essai après mise à jour du backend de test.** Son endpoint `/version`
annonce désormais `3edd5f2c5`, déployé à 01:27:04 UTC ; ce commit ne diffère
de `053f01f78` que par l'ADR et le plan. Émilien relance manuellement le même
DOCX. Le [nouveau job](https://preprod-app.territoiresentransitions.fr/collectivite/5460/plans/imports?importJobId=cb91819f-f119-4707-b858-4dad3a969004)
termine avec le statut `done` à 01:30:32 UTC et crée le
[plan `59229`](https://preprod-app.territoiresentransitions.fr/collectivite/5460/plans/59229).
Les étapes lecture/extraction sont `ok` et les étapes génériques `skipped` ;
le compte rendu ne signale aucune anomalie.

Le navigateur confirme les trois axes attendus, le sous-axe 1.4, les deux
engagements et l'action `TEST — Réseau de chauffagistes`, avec sa description
catalogue et ses trois sous-actions. L'action n'a aucun indicateur associé.
Le lien "Détails de l'import" du menu et le retour "Ouvrir le plan" fonctionnent.
Le plan reste en attente de validation utilisateur. Ce scénario valide
l'extraction et la création sans cible chiffrée ; les indicateurs, les liens
vers des fiches existantes et les rejets documentaires restent à recetter.

**Recette plus complète.** Un DOCX synthétique comportant E03/E07/E12 et quatre
fiches est vérifié hors ligne avec le lecteur et l'extracteur réels, puis lancé
manuellement par Émilien. Le [job](https://preprod-app.territoiresentransitions.fr/collectivite/5460/plans/imports?importJobId=38a2baf1-2950-45fb-b087-3f6af5b5e8ea)
crée le [plan `59234`](https://preprod-app.territoiresentransitions.fr/collectivite/5460/plans/59234).
Le navigateur confirme quatre axes, deux sous-axes et onze fiches comptées :
six principales et cinq sous-actions nouvelles. Les descriptions, objectifs,
statuts, structures et partenaires sont conformes ; les dates mois/année sont
normalisées au premier jour du mois. Les trois sous-actions catalogue et les
deux sous-actions saisies sont présentes avec les échéances attendues.

Les définitions E07 `s_26` et `s_26.a` existent avec l'unité et la périodicité
attendues. L'axe recharge affiche les cibles 120 et 30 pour 2030 ; les objectifs
de la collectivité restent non renseignés. L'indicateur personnalisé `88541`
conserve le résultat zéro en 2025 et l'objectif 10 en 2030. La fiche existante
`160210`, référencée par un hyperlien Word, conserve titre, description,
objectifs, statut, calendrier et trois sous-actions, comparés avant/après.
Ces trois sous-actions restent consultables via leur parent mais ne reçoivent
pas de nouveau lien axe et n'entrent pas dans le compteur du nouveau plan.
Le compte rendu signale cette préservation avec `EXISTING_FICHE_PRESERVED`.

Une variante du même DOCX contient la date "2026". Son
[import](https://preprod-app.territoiresentransitions.fr/collectivite/5460/plans/importer-ia?importJobId=910af4cc-037b-487d-9a59-f0c5e25e03e7)
échoue avec `INVALID_ELECTRIFICATION_DATE`, tableau 2, ligne 13, cellule 2,
et `createdPlanId: null`. Ces scénarios ne qualifient pas les autres
correspondances métier, les références inaccessibles, la reprise ni
l'assistance IA : les données du document valide sont reconnues sans
interprétation lors de la vérification hors ligne.

## Validation attendue

Ces critères décrivent la validation attendue de l'implémentation complète.
Les anciens lots en couvraient une partie ; leurs résultats sont historiques.
La composition A/B élargie doit être vérifiée séparément avant fusion :

- Dans A, l'import actif conserve ses formats, son plan immédiat, sa transaction,
  ses erreurs et sa reprise. Le PCAET reste un job public `generic` avec
  `withSecteurs` ; le bypass diagnostic exige toujours une activation explicite.
  Les nouvelles primitives d'indicateurs respectent la transaction appelante
  et les anciens upserts conservent leurs effets.
- Dans B, le nouveau profil public PCAET partage le moteur multiformat et
  conserve son plan immédiat. Les nouveaux jobs et les anciens jobs PCAET
  `generic` reprennent avec leurs contrats et leurs options d'origine.
  Aucun changement de profil n'est appliqué aux jobs existants.

- Le DOCX officiel V4 et ses variantes synthétiques conservent toutes les
  valeurs attendues, les textes libres, les liens et les localisations.
  Les autres formats, structures inconnues et valeurs invalides dans les champs
  contrôlés sont refusés sans omission silencieuse. Une extraction entièrement
  reconnue ne déclenche aucun appel au modèle ; les dates, statuts et références invalides
  ne sont jamais corrigés par l'assistance.
- L'assistance ne reçoit que les cellules numériques candidates ; les valeurs
  déjà reconnues restent inchangées. Des citations absentes, nombres ajoutés ou
  omis, emplacements inattendus, plages et informations manquantes bloquent.
  Les valeurs acceptées repassent dans les mêmes validateurs et résolveurs.
  Le checkpoint conserve sources originales, interprétations et tokens ; une
  reprise compatible ne rappelle pas le modèle. Le parcours générique reste
  inchangé et l'admission Électrification reste fermée en production.
- Une convention V4 avec modèle vide et exemple fictif n'importe que les vraies
  fiches actions ; un axe retenu sans fiche est créé ; E01/E02 partagent un axe.
- Une fiche sous un axe numéroté sans engagement retenu crée cet axe sans
  erreur, engagement ni cible supplémentaires ; un axe non demandé reste absent.
- Les codes, URL affichées ou masquées derrière un lien et clés de parent
  survivent au pipeline ; deux fiches homonymes restent distinctes.
- Un catalogue partiellement validé permet un import dont toutes les références
  utilisées sont résolubles. Une référence inconnue, incohérente, inaccessible
  ou `pending`, y compris dans un complément automatique, bloque sans création
  de plan ; une cible absente reste vide ; aucune valeur n'est inventée.
- Une aide sans URL est omise avec un avertissement sans empêcher la création
  de l'action ; une URL d'aide renseignée mais invalide reste bloquante.
- L'interface utilise "action" et un libellé d'upload compréhensible. Une
  relance après correction conserve titre, type et options, accepte le fichier
  remplacé et crée un nouveau job sans modifier l'ancien. Le détail affiche
  chaque erreur une seule fois, avec une localisation métier et la correction
  attendue ; une erreur de configuration est attribuée à l'équipe.
- Une URL réutilise le même objet et conserve champs, valeurs et autres liens.
  Une cible annexe coexiste avec un objectif 2030 déjà renseigné grâce à sa
  source distincte. Deux plans de la même collectivité ne mélangent ni leurs
  objectifs ni leurs calculs ; les lectures ciblent la métadonnée du plan.
- Après validation métier et intégration des définitions, E06 et E08 lient
  respectivement `v_particulier_elec` et `autobus_autocar_elec`
  dans les axes 5 et 8, avec une cible chacun. Une définition manquante bloque
  avant création du plan, sans substitution par un indicateur d'immatriculations
  ou personnalisé, et sans demander de corriger l'annexe.
- E07 crée deux cibles distinctes liées à `s_26` et `s_26.a` dans l'axe 6,
  sans recréer les indicateurs ni modifier leurs autres valeurs ou formules. Une cible
  vide ne supprime pas l'autre ; le total et sa partie rapide ne sont pas additionnés.
- Les personnalisés reçoivent leurs valeurs datées ; les oui/non deviennent
  des sous-actions ; un objectif "Oui" ne vaut pas résultat "Oui".
- Renommer les axes, fiches et indicateurs personnalisés, déplacer ou retirer
  les liens reste possible avec les droits ordinaires. Le titre d'un indicateur
  prédéfini reste celui du catalogue, sans renommage local ni global par l'import.
- En 4D, vérifier que les références restent lisibles après édition,
  qu'un élément libre ne devient pas une référence et
  qu'une duplication ordinaire ne copie pas l'identité d'annexe. Les écritures
  publiques ne doivent pas permettre d'attribuer les codes réservés à l'import.
- Les erreurs d'écriture et workers concurrents ne laissent aucun agrégat
  partiel ni doublon ; tester la création d'indicateurs dans le rollback.
- Les imports génériques conservent leur comportement. Tester le parcours
  annexe sans `planId` avant succès, le retour sur un job échoué après fermeture
  de la page et les permissions par collectivité. Un échec d'enfilement sans
  plan n'appelle pas sa suppression et ne laisse aucun job bloquant les quotas.
- Une divergence de profil, de version technique ou de catalogue entre job et
  checkpoint, ou une version de checkpoint non prise en charge pour ce profil,
  interdit la reprise, même après la dernière étape. Un format non supporté
  conserve source et checkpoint ; les checkpoints génériques v1 restent
  reprenables. Une reprise autorisée revalide références et droits avant écriture.
- Un mapping lauréat–collectivité absent, obsolète ou ambigu bloque avant
  enfilement et création du plan ; source et version de la décision sont traçables.

Privilégier les règles pures, les tests de router avec base réelle et le
[full flow avec faux LLM](https://github.com/incubateur-ademe/territoires-en-transitions/blob/feat/electrification-plan-import/apps/backend/src/plans/ai-plan-import/ai-plan-import.full-flow.e2e-spec.ts).
Les e2e du profil Électrification utilisent le vrai parser sur des DOCX
synthétiques et un faux LLM pour l'assistance ciblée ; le parcours générique
conserve également son faux LLM. Ces tests vérifient les garde-fous, pas la
fidélité du modèle réel.
Comparer les premiers documents réellement remplis à leurs extractions selon le
[guide d'évaluation](https://github.com/incubateur-ademe/territoires-en-transitions/blob/feat/electrification-plan-import/apps/backend/src/plans/ai-plan-import/eval/README.md)
dès leur disponibilité. Les fixtures ne démontrent pas la couverture de ces
usages encore inconnus. Comparer le parser seul et l'assistance sur les mêmes
documents annotés, en comptant les rejets injustifiés et les valeurs incorrectes
acceptées, puis faire valider les résultats avant l'ouverture du profil.
Aucun test automatisé ni agent ne déclenche un appel réel au modèle.

## Questions ouvertes et dépendances avant ouverture

1. **E08.** [Quelle formule et quel périmètre autobus/autocars retenir ?][question-e08]
   La source additionne les pourcentages de deux parcs distincts.
2. **Indicateurs des fiches.** [Quels identifiants TeT correspondent aux codes
   Grist, et à quelle période rattacher les deux indicateurs ponctuels ?][question-mapping]
   [Quelle unité principale pour `1-a`, `1-b`, `1-c` ?][question-unites]
   Pour la recharge, [quelle référence couvre le seuil ≥150 kW de `6-b` ?][question-recharge]
   La confirmation des références d'engagement E07 ne suffit pas à établir
   l'équivalence de périmètre des indicateurs Grist.
3. **Lauréats.** [Quelle liste maintenue fait foi, et quelle collectivité TeT
   porte le plan de chaque groupement ?][question-laureats]
   Le [croisement d'activité TET-8065](https://app.notion.com/p/3e96523d57d780beb6cffcd9e04b01a9)
   fournit deux fichiers de 109 lauréats, datés des 8 et 30 septembre.
   La vérification du dump local le 10 novembre trouve 107 correspondances
   pour 106 collectivités distinctes, mais révèle deux mauvais rattachements :
   [Libournais → Serre-Ponçon et Terre de Provence → Salon-de-Provence][question-rattachements].
   SCOT Périgord Vert et SIEDS restent sans correspondance ; plusieurs
   groupements sont réduits à un seul membre pour les statistiques d'usage.
   Les fichiers relus les 10 et 11 novembre sont inchangés. La
   [discovery Haute-Corrèze](https://app.notion.com/p/3ff6523d57d78075bb9ce436a65d647c)
   identifie un porteur pour ce cas, sans régler tous les groupements.
   L'intégration du 11 novembre autorise 77 correspondances vérifiées et
   28 porteurs repris provisoirement à la demande d'Émilien. Les deux erreurs
   des EPCI sont corrigées. Quatre groupements restent exclus et les porteurs
   provisoires restent à confirmer.

La question des aides sans URL est fermée par la
[réponse du 11 novembre][decision-aides] : elles sont omises avec un
avertissement, sans bloquer l'action. La remarque de Baptiste sur les périodes
mensuelles ou trimestrielles ne précise pas le rattachement des deux indicateurs
ponctuels ; elle ne suffit pas à compléter leur configuration ni les unités
et correspondances encore ouvertes.

Les neuf périodicités annuelles et la traduction E09 "Nombre" → `nb` sont
intégrées. Les actions/sous-actions, leurs identifiants stables et leurs liens
sont livrés ; les 113 correspondances TeT des indicateurs restent à compléter.
Le mapping
lauréats est livré pour 105 correspondances, dont 28 porteurs provisoires ;
4 groupements restent à résoudre. B ajoute séparément la collectivité de
démonstration `5460` pour la recette. Vérifier les définitions, unités, périodes
et rattachements dans l'environnement cible. Les cibles et correspondances d'indicateurs
`pending` restent bloquantes ; ces ajustements n'ouvrent pas l'admission.

L'affichage des cibles par métadonnée exacte, préparé dans #5806, est repris
dans B ; il n'est plus une question ouverte de conception. La nouvelle
composition, la préproduction et l'ouverture restent à qualifier.

[pr-foundations]: https://github.com/incubateur-ademe/territoires-en-transitions/pull/5812
[pr-import]: https://github.com/incubateur-ademe/territoires-en-transitions/pull/5813
[question-e08]: https://app.notion.com/p/3d66523d57d780999cded9124716b3ed?d=4146523d57d781f6950d001cc7198e94
[question-mapping]: https://app.notion.com/p/3f16523d57d7808ab94ef5f8b79e4c90?d=40d6523d57d78177b5db001c7ef4622d
[question-unites]: https://app.notion.com/p/3f16523d57d7808ab94ef5f8b79e4c90?d=4146523d57d78187ba41001c9e9b9ed9
[question-recharge]: https://app.notion.com/p/3d66523d57d78028a8b8f67932311e86?d=4146523d57d781a18ee2001c1badc5f7
[question-laureats]: https://app.notion.com/p/3e96523d57d780beb6cffcd9e04b01a9?d=37b6523d57d783a1b1d9038c7c02dfd8
[question-rattachements]: https://app.notion.com/p/3e96523d57d780beb6cffcd9e04b01a9?d=4146523d57d7818fbfa6001c9406d183
[decision-aides]: https://app.notion.com/p/3f16523d57d7808ab94ef5f8b79e4c90?d=4146523d57d781b891ed001cee19a898
[retours-tt67]: https://app.notion.com/p/4156523d57d780a9bf20ec12b9bae893
