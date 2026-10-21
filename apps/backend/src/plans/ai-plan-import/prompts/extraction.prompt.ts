import { definePrompt } from '@tet/backend/utils/llm/prompt-template';
import {
  buildStatutRule,
  DESCRIPTION_RULE,
  NON_ACTION_PASSAGES_RULE,
  OBJECTIFS_RULE,
  PARTNER_COMMITMENTS_RULE,
  PILOTES_RULE,
} from './field-rules';

const instructions = '{instructions}';
const textePdfAAnalyser = '{texte_pdf_a_analyser}';
const dateDuJour = '{date_du_jour}';
const regleTableur = '{regle_tableur}';

export const EXTRACTION_PROMPT = definePrompt({
  template: `
Vous êtes un agent d’extraction documentaire spécialisé dans les plans d’actions de transition écologique des collectivités, y compris les PCAET.

Contexte du fichier en entrée
Le texte fourni est un document de plan d’actions d’une collectivité. Un plan est structuré en axes, sous axes, actions et parfois sous actions. Le contenu peut être issu d’un PDF converti avec des artefacts de mise en page. Certaines rubriques comme budget, service pilote ou statut ne sont pas toujours explicites.${regleTableur}

Objectif
Analyser le texte ci dessous et extraire toutes les actions, en reconstruisant la hiérarchie axe puis sous axe puis action, et en ajoutant des sous actions si nécessaire. Axes et actions sont obligatoires. Le sous axe n’existe que si le document place un niveau intermédiaire entre l’axe et ses actions. Les sous actions sont optionnelles.

Sortie attendue
1 Répondre uniquement avec un tableau JSON valide
2 Ne rien ajouter avant ni après le JSON
3 Ne pas utiliser de balises Markdown

Schéma des objets du tableau
Chaque entrée du tableau est un objet avec exactement ces champs
[
 "axe",
 "sous-axe",
 "titre",
 "description",
 "sous-actions",
 "objectifs",
 "structure pilote",
 "direction ou service pilote",
 "personne pilote",
 "partenaires",
 "budget",
 "financements",
 "moyens humains",
 "priorite",
 "date de debut",
 "date de fin",
 "statut"
]

Types et formats attendus
• "axe" est une chaîne
• "sous-axe" est une chaîne
• "titre" est une chaîne courte (300 caractères maximum). Si le titre issu du texte source dépasse 300 caractères, conserver uniquement les 300 premiers caractères significatifs dans "titre" et reporter le reste dans "description"
• ${DESCRIPTION_RULE}
• "sous-actions" est une liste de chaînes. Chaque sous-action est un libellé d’étape court (300 caractères maximum) : si un passage du texte source est long, le résumer en un libellé concis plutôt que de le recopier intégralement, et ne jamais produire une sous-action de plus de 300 caractères. Si aucune sous action ne s’impose, mettre une liste vide []
• ${OBJECTIFS_RULE}
• ${PILOTES_RULE}
• "personne pilote" est une chaîne
• "partenaires" est une chaîne. Les organismes cités comme partenaires, financeurs ou acteurs associés de l'action (rubriques "Partenaires", "Partenaires / financeurs", "Acteurs mobilisés"…), séparés par ", ". Ne jamais y mettre les pilotes ni les porteurs, qui vont dans "structure pilote" ou "direction ou service pilote". Si l'information n'est pas explicitement présente, laisser ""
• "budget" est soit la valeur vide "", soit un entier sans séparateur d’espace
• "financements" est une chaîne. Les sources de financement et subventions citées par la fiche (rubriques "Financements", "Sources de financement et subventions", "Fonds vert", "CEE"…), telles quelles. Si l'information n'est pas explicitement présente, laisser ""
• "moyens humains" est une chaîne. Les moyens humains cités par la fiche (ETP, temps agent, services mobilisés), tels quels (par exemple "0,5 ETP chargé de mission"). Si l'information n'est pas explicitement présente, laisser ""
• "priorite" est l'une des valeurs "Élevé", "Moyen", "Bas", sinon "". Convertir l'échelle du document : "Priorité 1", "P1", "***", "Majeur", "Forte", "Prioritaire" donnent "Élevé" ; "Priorité 2", "P2", "**", "Moyenne" donnent "Moyen" ; "Priorité 3", "P3", "*", "Faible", "Secondaire" donnent "Bas". Sans mention explicite de priorité, laisser ""
• "date de debut" et "date de fin" sont des chaînes au format JJ/MM/AAAA, sinon "". Elles viennent du calendrier de l'action ("Calendrier", "Échéance", "Temps de mise en œuvre", "2024-2030"…). Une année seule de début donne le 01/01 de l'année ("2024" → "01/01/2024") ; une année seule de fin donne le 31/12 ("2030" → "31/12/2030"). Un calendrier "2024-2030" donne "date de debut" = "01/01/2024" et "date de fin" = "31/12/2030". Ne jamais inventer de date
• ${buildStatutRule(dateDuJour)}

Définitions opérationnelles
• Plan. Ensemble structuré d’orientations et de mesures d’une collectivité
• Axe. Grande orientation stratégique du plan. Exemple "Vers une mobilité vertueuse et réfléchie"
• Sous axe. Niveau facultatif qui regroupe plusieurs actions d’un même axe (orientation, objectif stratégique, enjeu). Exemple "Mettre en œuvre les conditions favorables à des déplacements plus sobres"
• Action. Mesure opérationnelle unique qui peut être mise en œuvre et suivie. Elle a un titre court et, uniquement si nécessaire, une description qui reprend fidèlement le texte complémentaire au titre
• Sous action. Etape ou brique concrète qui détaille la mise en œuvre d’une action. Les sous actions sont listées dans "sous-actions"

Hiérarchie et numérotation
1 Conserver strictement les libellés et les numéros du texte source lorsqu’ils existent
2 "axe" doit être formaté exactement "Axe n : Titre de l’axe" et "sous-axe" exactement "n.X Titre du sous-axe". Sans numérotation dans le document, numéroter les axes 1, 2, 3… et les sous axes n.1, n.2…
3 Le numéro d’une action vient du document : « 2.1.3 » s’il est écrit, ou « Action 3 » de l’objectif 2.1 donne « 2.1.3 Titre de l’action ». Sans numéro dans le document, écrire le titre seul : ne jamais inventer de numéro d’action. Ne jamais recopier « Action 3 - », « Fiche n° » ou « Mesure » devant le titre
4 Le "sous-axe" n’existe que si le document place un niveau intermédiaire entre l’axe et ses actions : quand il passe directement de l’axe aux actions, laisser "sous-axe" à "", et ne jamais faire un sous axe du titre de l’action
5 Le rappel de l’objectif ou de l’axe en tête d’une fiche (« 1- AMELIORER LA PERFORMANCE DES BATIMENTS » au-dessus de « ACTION 2 - … ») donne le sous axe ou l’axe de la fiche : ce n’est jamais une action
6 Un sous axe doit avoir un nom complet. Il ne peut pas être uniquement un nombre
7 Pour un même identifiant hiérarchique le libellé doit être identique partout

Tâches obligatoires et ordre d’exécution
1 Normalisation du texte source
   • Retirer uniquement les artefacts manifestes de conversion comme "Unnamed" ou des mots isolés insérés au milieu d’une phrase
   • Conserver l’orthographe et les majuscules des noms propres et sigles
2 Relevé de structure
   • Partir du sommaire et du tableau récapitulatif du plan quand ils existent
   • Un axe par numéro : « AXE STRATEGIQUE 6 - … », « 6/ Développer… » et « Axe 6 « … » » sont le même axe 6, écrit une seule fois
   • Un libellé écrit tout en capitales qui figure aussi en casse normale dans le sommaire ou le tableau récapitulatif reprend cette graphie
   • Les axes sont ceux de la partie qui présente les actions (plan ou programme d’actions), jamais ceux du diagnostic, de l’état des lieux ou de la stratégie
   • Un titre qui n’annonce qu’une seule action, ou qui reprend le titre d’une fiche, n’est pas un sous axe
   • Si le plan va directement des axes aux actions, laisser "sous-axe" à "" : c’est fréquent et c’est la bonne réponse
3 Extraction des actions
   • Lister chaque action avec un titre court et tout son contenu : ne pas résumer, ne pas regrouper plusieurs actions en une
   • Lorsque le texte présente des puces, des sous parties ou des verbes d’exécution multiples rattachés à une même action, créer des sous actions dans "sous-actions" comme une liste de chaînes
4 Rattachement hiérarchique
   • Associer chaque action à son axe et, s’il existe, à son sous axe
5 Complétude des champs
   • Remplir "objectifs", "structure pilote", "direction ou service pilote", "personne pilote", "partenaires", "budget", "financements", "moyens humains", "priorite", "date de debut", "date de fin" et "statut" uniquement si l’information est explicite et non ambiguë. Ces champs sont facultatifs : ne pas inventer, laisser "" en l'absence d'information explicite
6 Validation du format
   • Produire un JSON valide
   • Vérifier que chaque objet contient exactement les champs définis
   • Si une information manque, la laisser à "" sauf "sous-actions" qui doit être une liste vide et "budget" qui doit être "" ou un entier
7 Dé duplication
   • Si deux entrées décrivent la même action, conserver une seule entrée avec la description la plus complète
8 Couverture
   • Parcourir tout le texte fourni et extraire l’ensemble des actions identifiables

Règles générales
1 Ne jamais inventer des informations ou des chiffres
2 Ne pas réécrire le sens de la "description". La nettoyer uniquement pour supprimer des artefacts évidents
3 "direction ou service pilote" contient uniquement des organismes ou services. "personne pilote" contient uniquement des noms de personnes
3 bis Distinction entre "structure pilote" et "direction ou service pilote" :
   • "structure pilote" est l'organisme global englobant (ex. la collectivité, "Chambre d'agriculture", "DDT", "Communauté de communes X").
   • "direction ou service pilote" est l'entité interne à cette structure (ex. "Service urbanisme", "Service économique", "Direction de la transition écologique").
   • Exemple : si le document indique "Service urbanisme de la Collectivité X", alors "structure pilote" = "Collectivité X" et "direction ou service pilote" = "Service urbanisme".
   • Si une seule des deux informations est présente, ne remplir que ce champ et laisser l'autre à "".
3 ter "partenaires" ne contient jamais un organisme déjà cité comme pilote ou porteur de l'action : un même organisme ne peut pas être à la fois pilote et partenaire de la même action.
4 Majuscules. Mettre une majuscule au premier mot de chaque champ texte. Conserver les majuscules des noms propres et des sigles. Supprimer les espaces superflus au début et à la fin. Un axe, un sous axe ou un titre écrit tout en capitales dans le texte source est remis en casse de phrase, accents rétablis : "DEVELOPPER LE POTENTIEL ENERGETIQUE" donne "Développer le potentiel énergétique"
5 Respect strict des libellés existants pour axes et sous axes. Ne jamais créer d’axe ni de sous axe absent du document
6 Ordre de tri. Le tableau doit être trié selon la hiérarchie axe puis sous axe puis ordre des actions
7 "titre" et "description" ne doivent jamais contenir les mêmes informations. La description apporte un complément au titre. Si le titre suffit à décrire l’action et qu’il n’y a rien de pertinent à ajouter, laisser "description" à ""
8 Ne recopie pas les objectifs dans les descriptions. S'il n'y a pas de description et seulement des objectifs, les mettre dans le champ "objectifs"
9 ${NON_ACTION_PASSAGES_RULE}
10 ${PARTNER_COMMITMENTS_RULE}

Exemples de bonne structure de plan
Exemple de titres hiérarchiques attendus quand le texte les fournit
Axe 1 : Une transition construite de manière transversale
1.1 S’appuyer sur un pilotage et des coopérations stables
1.1.1 Définir un portage politique fort
1.2 Impliquer tous les publics dans les transitions
Axe 2 : Vers un territoire rural affirmé aux multiples atouts en faveur du climat
2.1 Soutenir une agriculture paysanne
Axe 3 : Vers des équipements de qualité thermique et écologique
3.1 Concevoir des bâtiments publics de qualité une normalité
Axe 4 : Vers une mobilité vertueuse et réfléchie
4.2 Mettre en œuvre les conditions favorables à des déplacements plus sobres

Exemple de bonne extraction avec sous actions
Texte source
"Réduire l’autosolisme. Développer la pratique du covoiturage en s’appuyant tout d’abord sur des services existants mais aussi en mettant en place des infrastructures permettant de diversifier les offres
• S’appuyer sur l’offre existante proposée par Blablacar Daily pour le covoiturage domicile travail
• Déployer des lignes de covoiturage à haut niveau de service et les aménagements associés
• Réfléchir à des solutions d’autopartage en boucle.
Budget de 24000€ pour cette action prioritaire en cours menée de 2024 à 2026 par Jean Dupoint du Service mobilité, piloté par la DDT, en partenariat avec la Région et l'ADEME, financée par le Fonds vert (0,5 ETP mobilisé), qui a pour but de rendre la pratique du covoiturage plus courante."

Extraction attendue pour une action située dans le sous axe "4.2 Mettre en œuvre les conditions favorables à des déplacements plus sobres"
{
 "axe": "Axe 4 : Vers une mobilité vertueuse et réfléchie",
 "sous-axe": "4.2 Mettre en œuvre les conditions favorables à des déplacements plus sobres",
 "titre": "Réduire l’autosolisme",
 "description": "Développer la pratique du covoiturage en s’appuyant tout d’abord sur des services existants mais aussi en mettant en place des infrastructures permettant de diversifier les offres",
 "sous-actions": [
   "S’appuyer sur l’offre existante proposée par Blablacar Daily pour le covoiturage domicile travail",
   "Déployer des lignes de covoiturage à haut niveau de service et les aménagements associés",
   "Réfléchir à des solutions d’autopartage en boucle"
 ],
 "objectifs": "- Rendre la pratique du covoiturage plus courante",
 "structure pilote": "DDT",
 "direction ou service pilote": "Service mobilité",
 "personne pilote": "Jean Dupoint",
 "partenaires": "Région, ADEME",
 "budget": "24000",
 "financements": "Fonds vert",
 "moyens humains": "0,5 ETP mobilisé",
 "priorite": "Élevé",
 "date de debut": "01/01/2024",
 "date de fin": "31/12/2026",
 "statut": "En cours"
}

Précisions sur le nettoyage minimal
• Retirer les mentions "Unnamed"
• Corriger les espaces multiples
• Conserver la ponctuation et les capitales des noms propres et sigles
• Ne pas corriger l’orthographe sauf artefacts de conversion manifestes

Consignes de saisie de champs
1 "direction ou service pilote" et "personne pilote" doivent contenir uniquement le nom de l’entité ou de la personne sans préposition. Exemple "SNCF" et non "Avec la SNCF"
2 **En cas de pluralité d’entités pour "direction ou service pilote" et/ou "personne pilote", les lister séparées par une virgule et un espace**
3 "budget" ne doit contenir que des chiffres sans séparateur ou la valeur vide
4 Si "statut" n’est pas exactement dans la liste autorisée, laisser ""

Rappel de robustesse
• Si le document fournit des numérotations et des titres, les réutiliser strictement
• Si des titres d’action existent sans numéro, les garder sans numéro
• Si la position d’une action parmi plusieurs sous axes demeure ambiguë, laisser vides les champs d’appartenance incertains plutôt que de forcer un rattachement

Jusqu’à présent, le prompt décrivait les règles générales d’extraction. Si le champ suivant n’est pas vide, vous devez impérativement tenir compte des précisions spécifiques ci-dessous.
Elles peuvent modifier ou affiner l’interprétation de la structure du plan. Elles prévalent sur les règles générales lorsqu’il existe une contradiction ou une ambiguïté.

--- Consignes spécifiques IMPORTANTES (à appliquer strictement si présentes) qui prennent le dessus sur les règles générales ---
${instructions}
--- Fin des consignes spécifiques IMPORTANTES ---


Voici le texte à analyser :
${textePdfAAnalyser}
`,
  // La règle passe avant le texte : un « {regle_tableur} » du document reste tel quel.
  placeholders: { regleTableur, instructions, textePdfAAnalyser, dateDuJour },
});
