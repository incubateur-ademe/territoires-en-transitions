import { definePrompt } from '@tet/backend/utils/llm/prompt-template';

const titres = '{titres}';
const fiches = '{fiches}';
const extraits = '{extraits}';
const variantes = '{variantes}';

/** La règle des thèmes posés au-dessus des fiches, sans réponse de l'utilisateur. */
export const THEMES_RULE =
  "- Quand les fiches sont rangées sous des thèmes relevés au-dessus d'elles (« BIODECHETS (végétaux) » sur « Action 3 »), ces thèmes sont les axes. Un extrait de structure sert alors à reprendre leur graphie et à réunir leurs variantes (« BIODECHETS (végétaux) » et « BIODECHETS (restes alimentaires) » sont l'axe « Biodéchets : restes alimentaires et végétaux » du sommaire), jamais à les remplacer par une autre grille, comme les axes d'un guide national.";

/** … quand l'utilisateur veut un axe pour chaque thème écrit sur les fiches. */
export const SEPARATE_THEMES_RULE =
  "- Quand les fiches sont rangées sous des thèmes relevés au-dessus d'elles (« BIODECHETS (végétaux) » sur « Action 3 »), chacun de ces thèmes est un axe distinct, même quand un extrait de structure en réunit plusieurs sous un seul libellé : « BIODECHETS (végétaux) » et « BIODECHETS (restes alimentaires) » restent deux axes. Un extrait de structure ne sert qu'à reprendre leur graphie, jamais à les réunir ni à les remplacer par une autre grille.";

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
- Reprenez les libellés et les numérotations du document ; ne créez aucun axe absent des sources.
- Un axe par numéro : « AXE STRATEGIQUE 6 - … », « 6/ Développer… » et « Axe 6 « … » » sont le même axe 6, écrit une seule fois.
- "numero" porte le seul numéro ("6", "6.2") ; "titre" ne répète ni « Axe 6 », ni « Objectif 2 - », ni le numéro.
- Un libellé écrit tout en capitales est remis en casse de phrase, accents rétablis, sigles conservés, sans remplacer aucun mot. Si le même libellé figure aussi en casse normale dans les sources (sommaire, tableau récapitulatif), reprenez cette graphie.
- Le sous-axe d'un axe numéroté prend le numéro de l'axe : « OBJECTIF 2 » de l'axe 6 est le sous-axe "6.2".
${variantes}
- Quand les titres sont rangés par partie du document, les axes sont ceux de la partie qui présente les actions (plan ou programme d'actions), jamais ceux du diagnostic, de l'état des lieux ou de la stratégie.
- Un sous-axe a un titre complet, jamais un simple numéro.
- Un sous-axe est un niveau intermédiaire qui regroupe plusieurs actions sous un même axe (orientation, objectif stratégique, enjeu). Un titre qui n'annonce qu'une seule action, ou qui reprend le titre d'une fiche, n'est pas un sous-axe.
- La liste des objectifs placée en tête d'un axe (« Objectifs de l'axe 1 : », puis ses lignes) ne range aucune action : ses lignes ne sont pas des sous-axes, même relevées comme des titres. Quand l'axe a aussi des titres numérotés qui regroupent ses actions (« Groupe d'actions 1.2 — … », « Mesure 1.2 … »), ce sont eux les sous-axes.
- Un titre que la mise en page d'un tableau coupe sur plusieurs lignes est recomposé en entier ; un fragment qui n'en fait pas partie (une date, un nom d'organisme) est écarté.
- Si le plan va directement des axes aux actions, laissez "sousAxes" vide : c'est fréquent et c'est la bonne réponse.
- Seule exception aux titres de fiches : celui que les extraits de structure, ou la mention « (regroupe : …) » de la liste des fiches, montrent regrouper plusieurs actions lettrées ou numérotées (« Mesure 1.1 … » suivie de « A. … », « B. … », ou « Groupe d'actions 1.2 ») est un sous-axe, pas une action.
- Ne mettez aucune action dans le squelette.
- Sans numérotation dans le document, numérotez les axes 1, 2, 3… et les sous-axes n.1, n.2…

Doute
- Remplissez "doute" seulement si vous ne pouvez pas reconstituer un plan d'actions fiable à partir des sources ; sinon "doute" vaut null. Un plan sans axes, sans sous-axes, sans numérotation ou rangé sous des thèmes n'est pas un doute.
- "motif" vaut :
  - "aucune-action" : les sources ne contiennent aucune action de la collectivité (diagnostic, état des lieux, stratégie ou bilan seuls) ;
  - "texte-illisible" : le texte est trop abîmé (caractères brouillés, mots coupés partout) pour reconnaître les titres ;
  - "plusieurs-plans" : le document réunit plusieurs plans d'actions distincts, chacun avec ses propres axes et ses propres actions (deux collectivités, deux démarches différentes). Les parties, tomes, volets ou années d'un même plan ne sont pas plusieurs plans ;
  - "grilles-concurrentes" : les mêmes actions sont rangées selon deux grilles d'axes incompatibles, sans que rien dise laquelle est celle du plan. Un sommaire qui reprend les axes, une correspondance avec un guide national ou un tableau croisé ne sont pas des grilles concurrentes : les règles ci-dessus disent laquelle suivre.
- "citations" : 1 à 4 passages courts recopiés mot pour mot des sources (un titre de préférence), qui montrent le problème. Pour "texte-illisible", recopiez des passages brouillés tels qu'ils sont écrits.
- "explication" : une ou deux phrases pour la collectivité, 300 caractères au plus.
- Même avec un doute, remplissez "axes" au mieux.

Répondez avec l'objet JSON { "axes": [ { "numero", "titre", "sousAxes": [ { "numero", "titre" } ] } ], "doute": null } ou, avec un doute, "doute": { "motif", "citations": [ … ], "explication" }.`,
  placeholders: { titres, fiches, extraits, variantes },
});
