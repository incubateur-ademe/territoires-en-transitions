import { definePrompt } from '@tet/backend/utils/llm/prompt-template';

const titres = '{titres}';
const extraits = '{extraits}';

export const SQUELETTE_PROMPT = definePrompt({
  template: `Vous reconstituez le squelette du plan d'actions d'une collectivité : ses axes et leurs sous-axes (orientations, objectifs), sans les actions.

Sources
1. Les titres relevés dans le document, dans l'ordre :
${titres}

2. Les extraits qui décrivent la structure du plan (sommaire, liste des axes, tableau récapitulatif) :
${extraits}

Règles
- Reprenez les libellés et les numérotations exacts du document ; ne créez aucun axe absent des sources.
- Un sous-axe a un titre complet, jamais un simple numéro.
- Si le plan n'a qu'un niveau, laissez "sousAxes" vide.
- Ne mettez aucune action dans le squelette.
- Sans numérotation dans le document, numérotez les axes 1, 2, 3… et les sous-axes n.1, n.2…

Répondez avec l'objet JSON { "axes": [ { "numero", "titre", "sousAxes": [ { "numero", "titre" } ] } ] }.`,
  placeholders: { titres, extraits },
});
