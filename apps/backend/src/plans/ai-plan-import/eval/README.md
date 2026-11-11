# Évaluation de l'import IA

Évalue l'extraction d'un document local selon son profil. Le profil générique
utilise le fournisseur configuré dans `apps/backend/.env` (`LLM_PROVIDER`,
`ALBERT_MODEL`, `GEMINI_MODEL`…). Le profil Électrification lit le canevas
DOCX V4 de façon déterministe, puis sollicite automatiquement une aide IA
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

## Profil Électrification

Le profil par défaut est `generic`. Pour extraire les engagements du tableau A
et les fiches renseignées de la section B d'une convention Électrification :

```sh
make ai-import-eval f=convention.docx args="--profile annexe-3-electrification --catalogue /chemin/absolu/catalogue.json"
```

Le fichier `--catalogue` contient une publication du catalogue à qualifier ; il
est obligatoire et validé avant tout appel au modèle. Aucun catalogue intégré
au code ne sert de valeur par défaut.

Ce profil accepte uniquement le canevas officiel V4 au format DOCX. Il lit
les tableaux et leurs libellés, conserve les sources et références
documentaires, les homonymes et les sous-actions. Nest et le fournisseur de
modèle sont initialisés uniquement si une valeur nécessite une interprétation.
Aucun OCR n'est exécuté. Aucun plan ni indicateur n'est créé.
Un autre format ou une structure non reconnue est refusé explicitement ;
aucun fallback IA ou générique n'est lancé pour ces erreurs.

Le JSON contient `checkpoint` (extraction typée, sources, versions et tokens),
`report.issues` (erreurs documentaires ou de traitement) et la durée.
Quand aucun appel n'est nécessaire, `provider: "deterministic"`,
`metrics.calls: 0` et les tokens à zéro identifient une extraction sans modèle.
`schemaVersion: 1` est l'unique
version technique du checkpoint. `templateVersion: "electrification-v4"`
identifie le canevas officiel ; `catalogueVersion` identifie les correspondances métier.
`stage: "extraction"` et `referencesResolved: false` indiquent que les codes,
URL, correspondances du catalogue et permissions restent à vérifier par le
résolveur. Un statut `done` signifie seulement que l'extraction a réussi ;
il ne qualifie pas un import ni les correspondances métier encore en attente.

L'aide IA concerne les cibles et résultats numériques non reconnus. Elle
utilise le fournisseur configuré et conserve la lecture déterministe de la
structure et les validations métier. Elle ne corrige pas les dates, statuts ou
références invalides. Les sources originales et les
interprétations retenues sont conservées dans `checkpoint.sources` et
`checkpoint.interpretations`, avec les extraits et valeurs littérales retenus.
`provider`, `model` et `metrics` rendent compte du fournisseur, des tentatives
d'appel et des tokens consommés, y compris en cas d'échec. Un document déjà
compris termine sans aucun appel.

Cette évaluation n'active pas le profil dans l'application.
Comparer chaque interprétation à sa source : mesurer les rejets évités et
les valeurs erronées acceptées, pas seulement le nombre d'extractions réussies.
Un statut `done` ne remplace pas cette vérification humaine.

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
- `draft` : le brouillon complet, tel qu'il serait enregistré.
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
