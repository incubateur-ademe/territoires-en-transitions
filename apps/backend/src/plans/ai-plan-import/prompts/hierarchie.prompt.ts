import { definePrompt } from '@tet/backend/utils/llm/prompt-template';

const squelette = '{squelette}';
const actions = '{actions}';

export const HIERARCHIE_PROMPT = definePrompt({
  template: `Vous êtes un agent de mise en cohérence d'un plan d'actions de collectivité. Les actions ci-dessous ont été extraites d'extraits différents du même document : leurs axes et sous-axes sont parfois libellés de façon variable, parfois absents, et une même action peut apparaître deux fois à la jonction de deux extraits.

Squelette du plan (les seuls axes et sous-axes admis)
${squelette}

Actions (index | axe > sous-axe > titre)
${actions}

Pour chaque action, rendez son rattachement définitif :
- "axe" et "sous-axe" reprennent exactement un libellé du squelette, au format "Axe n : Titre" et "n.X  Titre". Une action sans rattachement évident garde ses valeurs d'origine.
- "doublonDe" vaut l'index de la première occurrence si l'action répète une action déjà listée (même numéro ET même intitulé, ou même titre à la numérotation et à la casse près) ; sinon -1. Deux actions dont les titres diffèrent par un détail opérationnel ne sont pas des doublons, et un simple numéro identique dans deux axes différents n'est pas un doublon.

Chaque index d'entrée apparaît exactement une fois dans la réponse, sans omission.
Répondez avec un tableau JSON : { "index", "axe", "sous-axe", "doublonDe" }.`,
  placeholders: { squelette, actions },
});
