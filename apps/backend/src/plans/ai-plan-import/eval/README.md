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

## Ce que mesure le JSON

- `metrics` : nombre d'actions, d'axes et de sous-axes distincts, de
  sous-actions ; taux de remplissage par champ ; appels au modèle, dont les
  429 et les échecs ; tokens ; durée.
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

La référence de Clisson Sèvre et Maine Agglo vient de son tableau
récapitulatif : 7 axes et 64 fiches tabulaires, avec un bandeau d'objectif en
tête de chaque fiche et des pages en deux colonnes. `make` coupe le chemin du
document aux espaces : renommez-le avant (`csma.pdf`). Les métriques portent
sur le brouillon tel que le plan sera créé (titres sans numéro, axes unifiés).

Le `diff` donne alors les axes et actions retrouvés, les actions introuvables,
celles retrouvées en sous-axe (niveau inventé), celles rangées sous un autre
axe et les titres en trop. Il juge la structure, pas le contenu des fiches :
pour le contenu, comparer aussi avec une référence Gemini.

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
