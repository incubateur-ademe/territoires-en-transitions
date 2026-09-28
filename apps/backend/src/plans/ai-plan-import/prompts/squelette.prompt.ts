import { definePrompt } from '@tet/backend/utils/llm/prompt-template';

const titres = '{titres}';
const fiches = '{fiches}';
const extraits = '{extraits}';

export const SQUELETTE_PROMPT = definePrompt({
  template: `Vous reconstituez le squelette du plan d'actions d'une collectivité : ses axes et leurs sous-axes (orientations, objectifs), sans les actions.

Sources
1. Les titres relevés dans le document, dans l'ordre :
${titres}

2. Les titres des fiches actions, dans l'ordre : ce sont les actions, jamais des axes ni des sous-axes.
${fiches}

3. Les extraits qui décrivent la structure du plan (sommaire, liste des axes, tableau récapitulatif) :
${extraits}

Règles
- Reprenez les libellés et les numérotations exacts du document ; ne créez aucun axe absent des sources.
- Quand les titres sont rangés par partie du document, les axes sont ceux de la partie qui présente les actions (plan ou programme d'actions), jamais ceux du diagnostic, de l'état des lieux ou de la stratégie.
- Un sous-axe a un titre complet, jamais un simple numéro.
- Un sous-axe est un niveau intermédiaire qui regroupe plusieurs actions sous un même axe (orientation, objectif stratégique, enjeu). Un titre qui n'annonce qu'une seule action, ou qui reprend le titre d'une fiche, n'est pas un sous-axe.
- Si le plan va directement des axes aux actions, laissez "sousAxes" vide : c'est fréquent et c'est la bonne réponse.
- Ne mettez aucune action dans le squelette.
- Sans numérotation dans le document, numérotez les axes 1, 2, 3… et les sous-axes n.1, n.2…

Répondez avec l'objet JSON { "axes": [ { "numero", "titre", "sousAxes": [ { "numero", "titre" } ] } ] }.`,
  placeholders: { titres, fiches, extraits },
});
