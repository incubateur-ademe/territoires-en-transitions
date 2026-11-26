# Évaluation de l'import IA

Évalue l'extraction d'un document local selon son profil. Le profil générique
utilise le fournisseur configuré dans `apps/backend/.env` (`LLM_PROVIDER`,
`ALBERT_MODEL`, `GEMINI_MODEL`...). Le profil Électrification lit les canevas
DOCX V1 et V4 de façon déterministe, puis sollicite automatiquement une aide IA
ciblée si certaines valeurs restent incomprises.

**Un appel réel au modèle reste réservé à un lancement humain**, jamais par
un agent (cf. "Paid external AI calls" dans le `CLAUDE.md` racine). Cela
concerne les profils générique et Électrification, hors `--lecture-seule`.

```sh
make ai-import-eval f=chemin/vers/plan.pdf
make ai-import-eval f=plan.pdf ref=apps/backend/eval-out/reference-gemini.json
make ai-import-eval f=plan.xlsx out=apps/backend/eval-out/essai.json args="--no-verifications"
```

La cible compile le backend (`nest build`) puis lance
`dist/plans/ai-plan-import/eval/run-ai-import-eval.js` sous dotenvx. Le
résultat est écrit dans `apps/backend/eval-out/` (ignoré par git).

Hors PCAET, `--type-plan` donne au modèle le type du plan, comme le fait
l'application à partir du type choisi dans le formulaire :

```sh
make ai-import-eval f=plan-mobilite.pdf args='--type-plan "Plan Mobilité"'
```

### Questions à l'utilisateur

L'éval détecte les doutes du document comme l'application (stratégie
`segmented` seulement), affiche chaque question avec son choix proposé et
celui retenu (« Question : … »), puis lit le document avec le choix proposé :
ce qu'obtient l'utilisateur qui continue sans rien changer. Une option rejoue
une autre réponse, avec la consigne qu'elle ajouterait pour l'utilisateur :

| Option | Question |
|---|---|
| `--action-level fiche\|etape` | le niveau de l'action ; segmente à ce niveau même sans question (hors Électrification) |
| `--theme-grouping grouped\|separate` | les thèmes que la synthèse réunit |
| `--actions-without-fiche all\|with-fiche` | les actions qu'un récapitulatif liste sans fiche |

```sh
make ai-import-eval f=plpdma.pdf args='--action-level etape'
make ai-import-eval f=capg.pdf ref=apps/backend/src/plans/ai-plan-import/eval/references/plpdma-capg.json args='--theme-grouping separate'
```

La référence manuelle se juge avec les choix appliqués : au niveau de
l'action retenu ; avec `grouped`, les axes de `axesReunis` remplacent les
thèmes qu'ils réunissent ; avec `with-fiche`, les actions de
`actionsSansFiche` ne sont plus attendues.

## Profil Électrification

Le profil par défaut est `generic`. Pour extraire les engagements du tableau A
et les fiches renseignées de la section B d'une convention Électrification :

```sh
make ai-import-eval f=convention.docx args="--profile annexe-3-electrification --catalogue /chemin/absolu/catalogue.json"
```

Le fichier `--catalogue` contient une publication du catalogue à qualifier ; il
est obligatoire et validé avant tout appel au modèle. Aucun catalogue intégré
au code ne sert de valeur par défaut.

Ce profil accepte les canevas officiels V1 et V4 au format DOCX. Il lit
les tableaux et leurs libellés, conserve les sources et références
documentaires, les homonymes et les sous-actions. Nest et le fournisseur de
modèle sont initialisés uniquement si une valeur nécessite une interprétation.
Aucun OCR n'est exécuté. Aucun plan ni indicateur n'est créé.
Un autre format ou une structure non reconnue est refusé explicitement ;
aucun fallback IA ou générique n'est lancé pour ces erreurs.

Le JSON contient `checkpoint` (extraction typée, sources, versions et tokens),
`report.issues` (erreurs documentaires ou de traitement) et la durée. Lorsque
l'extraction réussit, `report.issues` est vide : la CLI ne construit pas les
avertissements de rapprochement du compte rendu de l'application.
`trace.interpretations` conserve les requêtes et réponses structurées de l'aide
IA, y compris celles précédant un refus. Elle permet de distinguer le critère
refusé (action ou objectifs) d'une réponse technique invalide. Cette
trace locale contient des extraits du document ; conserve le fichier de sortie
dans un répertoire d'évaluation ignoré par git.
Quand aucun appel n'est nécessaire, `provider: "deterministic"`,
`metrics.calls: 0` et les tokens à zéro identifient une extraction sans modèle.
Le checkpoint utilise uniquement la version définie dans le champ `schemaVersion`
de son [schéma](../electrification/extract-plan/electrification-extraction-checkpoint.schema.ts).
Les formats Word sont reconnus par les en-têtes des tableaux ; ils ne portent
pas une seconde version technique dans le checkpoint. `catalogueVersion`
identifie les correspondances métier.
`stage: "extraction"` et `referencesResolved: false` indiquent que les codes,
URL, correspondances du catalogue et permissions restent à vérifier par le
résolveur. Un statut `done` (code de sortie 0) signifie seulement que
l'extraction a réussi. Il ne valide pas la politique de rapprochement
`allowInterpretedEngagements` : la CLI peut terminer avec `done` alors que
l'application refuserait les rapprochements IA si cette politique était
désactivée. Il ne qualifie pas non plus la création du plan ni les
correspondances métier encore en attente.

L'aide IA rapproche les libellés inconnus des engagements publiés et interprète
les cellules numériques rédigées. Les nombres seuls, avec une unité déclarée
et une année entre parenthèses éventuelles, sont lus directement. La structure
et les validations métier restent déterministes. L'IA ne corrige pas les dates,
statuts ou références invalides. Elle associe les occurrences numériques
fournies à des clés de cible, unités et échéances, avec une citation exacte.
Pour les cibles d'engagement, l'unité et l'échéance du catalogue s'appliquent
si la cellule ne les précise pas. Une unité non répétée auprès d'une quantité
identifiable reste `null` dans l'interprétation, comme une année absente de la
cellule. Une unité ou une échéance explicite incompatible reste refusée.
Elle signale une cellule ambiguë ou conditionnelle par `status: "unresolved"` ;
l'extraction s'arrête alors avec une erreur documentaire.

Les sources originales et les interprétations retenues sont conservées dans
`checkpoint.sources` et `checkpoint.interpretations`, avec `numberId`, `yearId`
et les extraits justificatifs. Les valeurs sont lues dans les occurrences
désignées, sans reformater la réponse en texte ni la reparcourir par une
grammaire française. Les rapprochements d'engagements sont conservés dans
`checkpoint.engagementInterpretations`, avec le statut `review-required`.
Les libellés non reconnus passent par un rapprochement limité aux candidats
du même axe. Dans l'application, chaque rapprochement accepté affiche
"Rapprochement à vérifier" dans le compte rendu, avec les deux libellés et le
code retenu. La CLI conserve ces rapprochements dans le checkpoint pour
inspection, sans cet avertissement. Aucune équivalence de périmètre n'est
affirmée.

Le modèle compare l'action et les objectifs chiffrés dans le contexte du
programme Électrification : la sortie d'un usage fossile peut désigner sa
transition vers l'électricité. Une solution explicitement non électrique,
un maintien de l'usage fossile, une contradiction, une condition ou un choix
ambigu entre plusieurs candidats restent bloquants. Un périmètre plus large
ou plus restreint ne suffit pas à rejeter le rapprochement. Les valeurs,
unités et dates restent contrôlées, sans conversion.

Dans l'application, la [préparation de l'import](../electrification/extract-plan/prepare-electrification-import.service.ts)
applique la configuration `electrificationEngagementMatching.allowInterpretedEngagements`
définie dans la [configuration documentaire](../../plans/electrification/config/electrification-engagements-document.config.ts).
Elle autorise ces rapprochements avec avertissement. Désactivée, elle les
refuse tous ; les codes et libellés identiques après normalisation restent
reconnus sans IA. Une reprise réapplique cette politique et reconstruit le
compte rendu, sans nouvel appel IA, quelle que soit la classification du
checkpoint. La CLI s'arrête à l'extraction et n'exécute pas cette préparation.
Une réponse IA hors contrat, une citation modifiée ou un code non proposé
produisent une erreur de traitement, distincte d'un refus documentaire.
`provider`, `model` et `metrics` rendent compte du fournisseur, des tentatives
d'appel et des tokens consommés, y compris en cas d'échec. Un document déjà
compris termine sans aucun appel.

Cette évaluation n'active pas le profil dans l'application.
Comparer chaque interprétation à sa source : mesurer les rejets évités et
les valeurs erronées acceptées, pas seulement le nombre d'extractions réussies.
Les contrôles de présence, de format et de contraintes du catalogue ne prouvent
pas que le modèle a correctement compris le sens de la phrase. Inclure des
conditions, négations, approximations et unités contradictoires dans cette
qualification. Les tests automatisés utilisent un faux modèle et vérifient le
contrat d'extraction et les rejets techniques. Un statut `done` ne remplace pas
cette vérification humaine.

Les options `--ref`, `--instructions`, `--no-verifications`,
`--no-sous-actions` et `--lecture-seule` sont réservées au profil générique.
Leur utilisation avec Électrification est refusée avant la lecture du document.
La comparaison par titre et les métriques génériques ci-dessous ne s'appliquent
pas à ce profil. Le checkpoint peut être conservé pour une reprise interne
sans nouvelle extraction ; l'évaluation CLI n'expose pas de commande de reprise.

Pour vérifier le résultat, comparer les engagements retenus, les fiches et
chaque valeur à la source, y compris les absences et les zéros. Pour les fiches
et sous-actions, un mois et une année donnent par convention le premier jour
du mois (`06/2028` ou `juin 2028` → `2028-06-01`) ; une année seule ne suffit pas.
Les fixtures
synthétiques du canevas couvrent les variantes testées ; elles ne remplacent
pas la qualification des premiers documents réellement remplis.

## Lecture seule d'un tableur

Pour voir comment le code lit un classeur, sans appeler aucun modèle ni
démarrer Nest :

```sh
make ai-import-eval f=plan.xlsx args="--lecture-seule"
```

Le script affiche le rôle de chaque onglet (`plan`, `complement`, `synthese`,
`liste`, `masque`, `modele`) et de chaque colonne, avec la raison de chaque
choix, puis l'arbre des axes et des fiches et les avertissements. Un onglet
`modele` serait confié au modèle lors d'un vrai import. C'est la façon, sans
coût, d'essayer les heuristiques sur un nouveau classeur réel.

## Ce que mesure le JSON générique

- `metrics` : nombre d'actions, d'axes et de sous-axes distincts, profondeur
  du plus long chemin d'axes, nombre de sous-actions ; taux de remplissage par
  champ ; appels au modèle, dont les 429 et les échecs ; tokens ; durée.
- `trace` : le squelette relevé (axes et sous-axes) et les extraits gardés par
  le tri, avec leurs pages, leur titre et leur chemin de titres. C'est ce qui
  dit si un défaut vient du découpage, du tri ou de l'extraction. S'y ajoutent
  le nombre d'actions après chaque étape (`actionsByStep`) et les titres
  relevés à l'extraction puis absents du brouillon
  (`titlesDroppedAfterExtraction`). Ce n'est qu'une différence de titres :
  l'action a pu être fondue dans un doublon ou seulement reformulée. Une
  action manquante absente de cette liste n'a jamais été extraite.
- `draft` : le brouillon complet, tel qu'il serait enregistré.
- `error` : l'étape en échec et son motif. Pour un abandon motivé
  (`scouting: analysis_abandoned:<motif>`), suivi du message que lirait
  l'utilisateur : passages relevés, pages, explication du modèle. Un doute du
  modèle ignoré ou non confirmé apparaît dans `warnings` (« Doute du modèle
  … »). C'est ce qu'il faut relire pour caler l'abandon (voir le README de
  l'import, section « Abandon motivé »).
- `diff` (avec `ref=`) : écarts de métriques, titres de la référence
  introuvables dans le résultat, titres en trop. Les titres sont comparés sans
  numérotation, casse ni accents, et deux reformulations qui partagent
  l'essentiel de leurs mots sont tenues pour le même titre.

## Références manuelles

Un résultat de modèle, même bon, peut se tromper de structure : sur le PCAET
de Lyon, Gemini range les 23 actions en sous-axes et invente leurs titres.
`references/` contient des structures relevées à la main dans le sommaire
(`"manual": true`, axes et titres des actions attendus) :

```sh
make ai-import-eval f=lyon.pdf ref=apps/backend/src/plans/ai-plan-import/eval/references/lyon-pcaet-2030.json
make ai-import-eval f=csma.pdf ref=apps/backend/src/plans/ai-plan-import/eval/references/csma-pcaet-2021.json
```

La seconde référence couvre un programme à fiches tabulaires, relevé dans son
tableau récapitulatif : 7 axes et 64 fiches, avec un bandeau d'objectif en tête
de chaque fiche et des pages en deux colonnes. `make` coupe le chemin du
document aux espaces : renommez-le avant (`csma.pdf`). Une référence
manuelle juge le plan tel qu'il sera créé (titres sans numéro, axes unifiés),
enregistré sous `plan` ; les métriques et `draft` restent la sortie brute du
pipeline, comparable d'un run à l'autre.

Le `diff` donne alors les axes et actions retrouvés, les actions introuvables,
celles retrouvées en sous-axe (niveau inventé), celles rangées sous un autre
axe et les titres en trop. Une action obtenue ne répond qu'à une action
attendue : un doublon compte parmi les titres en trop. Le `diff` juge la
structure, pas le contenu des fiches : pour le contenu, comparer aussi avec une
référence Gemini.

Avec `--action-level etape`, une fiche qui détaille des `etapes` devient le
sous-axe de ses étapes, et ce sont elles qui sont attendues.

Une référence peut aussi donner, par action, le chemin d'axes complet
(`cheminAxes`, qui commence par `axe`) quand le plan a plus de deux niveaux.
C'est le cas de `ccpg-suivi-2021.json`, l'outil de suivi du PCAET de la CC du
Pont du Gard (classeur, onglet « Suivi ») : 4 ambitions, 15 objectifs
stratégiques, 33 objectifs opérationnels et 72 fiches, dont deux homonymes
rangées sous deux objectifs différents. Le `diff` donne alors en plus le
nombre de niveaux distincts à chaque profondeur, attendu et obtenu, et les
actions rangées sous le bon axe mais à un autre chemin. Le classeur n'est pas
dans le dépôt : renommez-le sans espaces (`ccpg.xlsx`), voyez d'abord sa
lecture, sans coût, puis lancez l'éval réelle (à faire par un humain) :

```sh
make ai-import-eval f=ccpg.xlsx args="--lecture-seule"
make ai-import-eval f=ccpg.xlsx ref=apps/backend/src/plans/ai-plan-import/eval/references/ccpg-suivi-2021.json
```

Attendu : aucun appel au modèle pour le repérage, l'extraction et la
hiérarchie, seulement pour les secteurs et la revue. Le même classeur sert à
une spec locale, sautée sans lui :

```sh
cd apps/backend
CCPG_XLSX="…/ccpg.xlsx" npx vitest run src/plans/ai-plan-import/pipeline/analyze-workbook/analyze-workbook.real-file.spec.ts
```

## Banc du découpage

Le banc compare, pour chaque référence qui donne son `fichier`, ce que la
lecture et la segmentation transmettent au modèle à la structure attendue.
Il n'appelle aucun modèle (ni structuration ni OCR : une page-image reste
vide) et tourne en quelques secondes. Les documents restent hors du dépôt :

```sh
cd apps/backend
AI_IMPORT_CORPUS=/chemin/du/corpus npx vitest run src/plans/ai-plan-import/eval/segment-bench
```

Sans `AI_IMPORT_CORPUS`, la spec est sautée ; un document absent du corpus
aussi.

Avant de compter, le banc vérifie les questions : chaque référence mesurée
doit déclarer `questionsAttendues` (`[]` pour un document clair), et la
lecture doit poser exactement ces questions, avec exactement ces choix
proposés. Une question superflue sur un document clair, une question
perdue ou un autre choix proposé font échouer le banc. Il vérifie aussi
qu'aucun document n'est tenu pour illisible (30 % de pages sans texte
exploitable), ce qui suffirait à confirmer un abandon `texte-illisible`.

| Référence | Questions attendues (choix proposé) |
|---|---|
| `plpdma-2026` | `action-level` (`fiche`) |
| `cot-ccvn`, `mobilite` | `action-level` par énumération (`etape`) |
| `plpdma-capg` | `theme-grouping` (`grouped`) |
| `biodiversite` | `actions-without-fiche` (`all`) |
| `pat`, `tourisme-dracenie`, `plpdma-actions`, `plpdma-ccbv` | aucune |

Le découpage se mesure ensuite avec les choix proposés appliqués : ce
qu'obtient l'utilisateur qui clique « Continuer ». `niveaux` et
`regroupements` font mesurer aussi les autres réponses. Pour chaque
document, chaque niveau de lecture et chaque regroupement des thèmes, le
tableau donne, sur les actions attendues :

| Colonne | Ce qui est compté |
|---|---|
| `trouvees` | une unité de fiche porte ce titre, même écourté |
| `titres` | … avec tous les mots du titre attendu |
| `numeros` | … avec le numéro du document en tête |
| `axe`, `chemin` | … sous le bon axe, puis sous le chemin attendu en entier |
| `enTrop` | unités de fiche qui ne répondent à aucune action attendue |
| `axes`, `libellesAxes` | axes attendus en tête d'un chemin, puis avec leur libellé entier |
| `questions` | les questions que pose le document, avec leur choix proposé |

Le détail (actions manquantes, titres écourtés, numéros perdus, fiches mal
rangées, unités en trop) est écrit dans `apps/backend/eval-out/segment-bench.json`.

[`segment-bench.baseline.json`](segment-bench/segment-bench.baseline.json) fixe
le seuil de chaque document : un score qui baisse fait échouer le banc. Un
score qui monte se fige en relançant avec `UPDATE_BASELINE=1`, et le seuil se
commite avec le changement qui l'a fait monter.

Le banc juge le découpage, pas le modèle : une action qui n'existe que dans
un tableau ou une liste à puces n'ouvre aucune unité et compte comme
manquante, même si le modèle sait l'en extraire. Ce manque dit que le code
ne transmet pas la structure, et que le modèle doit la deviner.

Quand la question des actions sans fiche se pose, le banc vérifie aussi ses
comptes : autant d'actions listées que la référence en attend, et autant
sans fiche que `actionsSansFiche` en déclare. La réponse ne change pas le
découpage (les tableaux se gardent ou non au tri) : le banc la mesure au
choix proposé seulement.

### Ajouter un document au corpus

Relever sa structure à la main dans `references/` : `fichier` (chemin dans le
corpus), `axes`, puis chaque fiche avec son `axe`, son `cheminAxes` s'il y a
des sous-axes, son `numero` tel qu'écrit et son `titre` complet relevé dans le
corps de la fiche. `etapes` donne les étapes titrées d'une fiche, et
`niveaux: ["fiche", "etape"]` les fait mesurer aussi en lecture à l'étape.
`remarques` garde les ambiguïtés tranchées pendant le relevé.

Déclarer aussi `questionsAttendues`, chaque question par son choix proposé
(`[{ "kind": "action-level", "actionLevel": "fiche" }]`, `[]` sans
question) : c'est ce qui empêche une question superflue de passer
inaperçue. Selon les questions :

- `theme-grouping` : `axes` donne les thèmes tels qu'écrits au-dessus des
  fiches (réponse `separate`), `axesReunis` chaque axe de la synthèse avec
  les thèmes qu'il réunit (réponse `grouped`), et
  `regroupements: ["grouped", "separate"]` fait mesurer les deux ;
- `actions-without-fiche` : `actionsSansFiche` donne les numéros des actions
  listées sans fiche ; le banc compare leur nombre à celui du doute.

Lancer le banc avec `UPDATE_BASELINE=1` pour fixer son premier seuil.

## Calibrer l'abandon

L'abandon motivé (README de l'import, section « Abandon motivé ») dépend de ce
qu'Albert écrit dans le champ `doute` du squelette, que le banc ne peut pas
mesurer. Il se calibre par un lot réel, **lancé à la main** (appels payants),
avant de toucher aux motifs ou aux seuils, puis après chaque changement du
prompt du squelette ou du modèle :

1. **Les plans du corpus** : cible, aucun abandon, aucun « Doute du modèle »
   dans `warnings`, et un `diff` qui ne régresse pas.
2. **Un extrait de diagnostic sans fiche** (biodiversité, p. 1-47) : cible,
   `error` commence par `scouting: analysis_abandoned:aucune-action`, et le
   message qui suit cite des passages réels du document. Vérifié sans
   modèle : l'extrait passe le garde-fou de tome, ne pose aucune question,
   n'a ni fiche, ni tableau, ni action numérotée, et va bien au squelette.
3. **Les autres réponses** aux questions de `plpdma-capg` et `biodiversite`,
   pour vérifier qu'elles ne déclenchent pas d'abandon (une réponse aux
   thèmes écarte les grilles concurrentes).

`make` coupe les chemins aux espaces : le lot copie d'abord chaque document
sous le nom de sa référence. La cible recompile le backend à chaque document :
ne modifiez pas le code pendant le lot. Depuis la racine du dépôt :

```sh
C=/chemin/du/corpus
R=$PWD/apps/backend/src/plans/ai-plan-import/eval/references
D=$PWD/apps/backend/eval-out/calibrage
mkdir -p $D
for ref in biodiversite cot-ccvn mobilite pat plpdma-2026 plpdma-actions plpdma-capg plpdma-ccbv tourisme-dracenie; do
  f=$(node -p "require('$R/$ref.json').fichier")
  cp "$C/$f" "$D/$ref.${f##*.}"
  make ai-import-eval f=$D/$ref.${f##*.} ref=$R/$ref.json out=$D/$ref.json
done

qpdf "$C/biodiversité/planintercommunalbiodiversited_z828ms.pdf" --pages . 1-47 -- $D/biodiversite-diagnostic.pdf
make ai-import-eval f=$D/biodiversite-diagnostic.pdf out=$D/biodiversite-diagnostic.json

make ai-import-eval f=$D/plpdma-capg.pdf ref=$R/plpdma-capg.json out=$D/plpdma-capg-separate.json args='--theme-grouping separate'
make ai-import-eval f=$D/biodiversite.pdf ref=$R/biodiversite.json out=$D/biodiversite-with-fiche.json args='--actions-without-fiche with-fiche'
```

Hors PCAET, ajoutez à `args` le `--type-plan` que l'application enverrait
pour ce document. Puis relire, document par document :

```sh
for f in $D/*.json; do echo "$f"; node -e 'const r=require(process.argv[1]); console.log(r.error ?? "ok", (r.warnings ?? []).filter((w) => w.startsWith("Doute du modèle")))' "$f"; done
```

Albert varie d'un lancement à l'autre : un doute isolé sur un plan du corpus
se rejoue avant de conclure. Les motifs `plusieurs-plans` et
`grilles-concurrentes`, confirmés par leurs seules citations, sont les
premiers à surveiller ; un faux abandon répété sur un plan du corpus se
corrige dans le prompt du squelette (définition du motif), pas par un
interrupteur.

## Méthode conseillée

1. Établir une référence avec le meilleur résultat connu (Gemini sur le PCAET
   de référence) : `out=apps/backend/eval-out/reference-gemini.json`.
2. Après chaque changement de prompt ou de modèle, relancer avec `ref=` sur
   les mêmes documents.
3. Regarder d'abord `missingTitles` et `sousAxes`, puis les taux de
   remplissage : c'est là que la qualité se joue.

Le quota Albert est de 10 imports par collectivité et par jour dans l'app,
mais le script ne passe pas par l'app : seul le quota de la clé (tokens par
minute) s'applique.
