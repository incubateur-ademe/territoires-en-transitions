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
  introuvables dans le résultat (comparés sans numérotation ni casse), titres
  en trop.

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
