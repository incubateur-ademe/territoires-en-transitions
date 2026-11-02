# Assistant (agent du backend sur le serveur MCP)

Une question, les outils du serveur MCP de l'utilisateur, un modèle qui les
enchaîne puis rédige. Même prompt et mêmes outils que dans Claude.ai ; le
modèle est celui de `LLM_PROVIDER` (Albert ou Gemini). Contexte et décisions :
[ADR 0021](../../../../../doc/adr/0021-serveur-mcp-dans-l-api.md), décision 8.

## Appel

Mutation tRPC `assistant.ask`, réservée à `utils.mcp.read` (comptes support ;
mode super admin pour lire une collectivité dont on n'est pas membre), 10
appels par minute.

```ts
trpc.assistant.ask.mutate({
  question: 'Où en est la démarche PCAET de la collectivité 4242 ?',
  history: [], // tours précédents { role: 'user' | 'assistant', text }, rien n'est stocké
  mode: 'analyse', // ou 'esquisse', avec esquisse: { sujet, appetit?, contexte? }
});
// → { answer, stopReason, modelCalls, toolCalls[], usage, provider, model, durationMs }
```

Bornes, réglables par l'environnement : `ASSISTANT_MAX_MODEL_CALLS` (8),
`ASSISTANT_TIMEOUT_MS` (120 000), `ASSISTANT_TIER` (`strong`).

## Dans Crisp : `/tet <question>`

Un opérateur écrit `/tet qui pilote le PCAET ?` en note privée. `apps/tools`
(`crisp/services/crisp-tet.service.ts`) relit la note par l'API Crisp (le
webhook n'est pas signé), poste « je cherche… », appelle `assistant.askFromCrisp`
avec le jeton service, puis répond en note privée. `/tet` seul demande un
résumé de l'utilisateur, de sa collectivité et de ce qui pourrait expliquer sa
demande (`DEFAULT_TET_QUESTION`).

- L'assistant agit au nom de l'opérateur, retrouvé par son e-mail : son compte
  TeT doit être support. Il lit **comme en mode super admin sans l'avoir
  activé**, limité aux opérations des outils MCP (`support-elevation.ts`) ;
  aucune écriture possible.
- Contexte automatique : profil TeT du visiteur (`find_user`) et ses 10
  derniers messages ; les `/tet` précédents de la conversation et leurs
  réponses servent d'historique. Rien n'est stocké.
- Prompt MCP `support-conversation` : réponses courtes, sans e-mail.
- Rien à configurer côté Crisp : le webhook et le jeton existants suffisent.
  Déployer le backend, puis `apps/tools` (`cd-tools`, manuel).

## Évaluation

Les scénarios (`eval/scenarios.ts`) jugent ce que l'agent fait : outils
appelés et arguments, mots attendus dans la réponse, et toujours aucune
adresse e-mail absente de la question, aucun chiffre sans outil réussi, un
plafond d'appels au modèle.

```sh
make assistant-eval                        # Albert, tous les scénarios
make assistant-eval provider=gemini        # Gemini (payant)
make assistant-eval tag=metier repeat=3    # un lot, répété
make assistant-eval scenario=score-cae
```

Rapport dans `reports/assistant-eval/` (`latest.md`, et JSON par run). Le run
s'arrête au-delà de `max_tokens` (500 000 par défaut). Les scénarios
`analytique` ne tournent qu'avec une vraie `ANALYTICS_DATABASE_URL`.

`eval/scenarios.e2e-spec.ts`, dans la suite normale, vérifie que chaque outil
MCP est couvert et que le prompt et les outils n'ont pas changé depuis la
dernière éval : après une modification, relancer l'éval puis reporter les
empreintes affichées dans `eval/baseline.json`.
