# Évaluation de l'import IA

Fait tourner le pipeline d'import sur un document local, avec le fournisseur
configuré dans `apps/backend/.env` (`LLM_PROVIDER`, `ALBERT_MODEL`,
`GEMINI_MODEL`…), et mesure le résultat.

**Chaque exécution appelle le modèle pour de vrai.** Le script est réservé à
un lancement humain, jamais par un agent (cf. « Paid external AI calls » dans
le `CLAUDE.md` racine).

```sh
make ai-import-eval f=chemin/vers/plan.pdf
make ai-import-eval f=plan.pdf ref=apps/backend/eval-out/reference-gemini.json
make ai-import-eval f=plan.xlsx out=apps/backend/eval-out/essai.json args="--no-verifications"
```

La cible compile le backend (`nest build`) puis lance
`dist/plans/ai-plan-import/eval/run-ai-import-eval.js` sous dotenvx. Le
résultat est écrit dans `apps/backend/eval-out/` (ignoré par git).

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

## Ce que mesure le JSON

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
