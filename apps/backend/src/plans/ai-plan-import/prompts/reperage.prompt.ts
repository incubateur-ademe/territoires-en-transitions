import { definePrompt } from '@tet/backend/utils/llm/prompt-template';

const extraits = '{extraits}';

export const REPERAGE_PROMPT = definePrompt({
  template: `Vous êtes un agent de tri documentaire. On vous donne le début d'extraits d'un document de plan d'actions d'une collectivité (PCAET, plan climat, plan de transition).

Classez chaque extrait dans une seule catégorie :
- "fiche_action" : il décrit une ou plusieurs actions ou mesures à mener (avec ou sans pilote, budget, calendrier, indicateurs).
- "structure" : sommaire, liste des axes, orientations ou objectifs, tableau récapitulatif du plan.
- "diagnostic" : état des lieux, chiffres du territoire, contexte, méthodologie, enjeux sans action ; aussi tout ce qui évalue ou suit le plan sans définir d'action (évaluation environnementale, analyse d'incidences, mesures d'évitement-réduction-compensation, tableaux d'indicateurs de suivi).
- "engagement_partenaire" : ce qu'une entreprise, une association ou une autre institution s'engage à faire de son côté (charte, contribution de partenaire, liste d'engagements signés) ; ce ne sont pas les actions de la collectivité.
- "autre" : éditorial, remerciements, glossaire, annexes, pages blanches.

En cas de doute entre "fiche_action" et une autre catégorie, choisissez "fiche_action" : mieux vaut lire un extrait de trop que manquer une action.

Répondez avec un tableau JSON, un élément par extrait, sans en oublier aucun : { "index": <numéro de l'extrait>, "type": <catégorie> }.

Extraits (numéro | pages | partie et titres qui le couvrent | début du texte)
${extraits}`,
  placeholders: { extraits },
});
