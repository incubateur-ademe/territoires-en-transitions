import { definePrompt } from '@tet/backend/utils/llm/prompt-template';
import {
  CARTOUCHE_RULE,
  DESCRIPTION_RULE,
  FIELD_ALLOCATION_EXAMPLE,
  OBJECTIFS_RULE,
  SOUS_ACTIONS_RULE,
} from './field-rules';

const actionsAAmeliorer = '{actions_a_ameliorer}';
const textePdfAAnalyser = '{texte_pdf_a_analyser}';

export const CONSOLIDATION_PROMPT = definePrompt({
  template: `
Vous êtes un agent d’extraction documentaire spécialisé dans les plans d’actions de transition écologique des collectivités, y compris les PCAET.

Contexte
On vous fournit :
1) Une liste d’actions ciblées que l’on souhaite extraire ou corriger.
2) Le texte source complet du plan d’actions (issu d’un PDF parfois bruité).

Vous NE devez travailler QUE sur les actions explicitement listées ci dessous.

Actions ciblées à traiter
Ces actions sont données sous forme de titres d'actions, préfixées de leur index entre barres verticales :

-------- DEBUT LISTE --------
${actionsAAmeliorer}
--------- FIN LISTE ---------

Texte source du plan d’actions. Il peut y avoir des artefacts de mise en page.

--------- TEXTE SOURCE ---------
${textePdfAAnalyser}
--------- FIN TEXTE SOURCE ---------

Objectif
Pour chaque action présente dans la liste "Actions ciblées à traiter" :
1) Parcourir le texte source.
2) Retrouver l’action correspondante à partir de son titre.
3) Extraire tous ses attributs en respectant strictement le schéma JSON décrit ci dessous.

Schéma de sortie
La sortie doit être un tableau JSON. Chaque élément est un objet contenant exactement ces champs :

"index"
"titre"
"description"
"objectifs"
"sous-actions"

Exemple :
[
  {
    "index": 12,
    "titre": "1.4.1 Animer et suivre le COT et la démarche de transition écologique",
    "description": "Assurer le suivi des actions pilotées par les collègues ou d'autres acteurs, animer le Comité de pilotage, et assurer la mobilisation des élus.",
    "objectifs": "- Réunir le Comité de pilotage deux fois par an",
    "sous-actions": [
      "sous_action_1",
      "sous_action_2",
      "sous_action_3"
    ]
  }
]

"index" est l’entier fourni entre les | au début de chaque ligne de la liste en entrée.

Types et formats attendus
• "index" est l’entier identifiant l’action, repris tel quel depuis la liste en entrée
• "titre" est une chaîne de la forme "n.X.Y Titre de l'action" qui doit correspondre à l’une des actions listées. Le titre ne doit pas dépasser 300 caractères. Si le titre issu du texte source dépasse 300 caractères, conserver uniquement les 300 premiers caractères significatifs dans "titre" et reporter le reste dans "description"
• ${DESCRIPTION_RULE}
• ${OBJECTIFS_RULE} "" si la fiche n'en donne pas.
• ${SOUS_ACTIONS_RULE}

Règles d’extraction spécifiques
1) Si l’information n’est pas explicitement présente dans le texte source, laisser ces champs à [] pour "sous-actions"
2) **SOYEZ COMPLETEMENT EXHAUSTIF SUR LES SOUS-ACTIONS.** La description ne garde que ce que sa règle ci-dessus permet.
3) Les objectifs vont dans "objectifs", tous, y compris ceux que la liste en entrée n'a pas relevés. Les autres champs de l'action (pilotes, partenaires, budget, financements, moyens, dates, statut) sont relevés à part : ne les reportez ni dans "description", ni dans "objectifs", ni dans "sous-actions". Chaque information va dans un seul champ.
4) ${CARTOUCHE_RULE}

Exemple de répartition des champs (ici, seuls "titre", "description", "objectifs" et "sous-actions" sont à rendre)
${FIELD_ALLOCATION_EXAMPLE}

Nettoyage minimal
• Corriger les espaces multiples
• Retirer les artefacts manifestes ("Unnamed", numéros isolés sans sens, etc.)
• Ne pas réécrire le sens de la description, uniquement nettoyer les artefacts

Sortie attendue
1) Répondre uniquement avec un tableau JSON valide
2) Ne rien ajouter avant ni après le JSON
3) Ne pas utiliser de balises Markdown
4) Le tableau ne doit contenir QUE les actions demandées qui ont pu être retrouvées dans le texte source
`,
  placeholders: { actionsAAmeliorer, textePdfAAnalyser },
});
