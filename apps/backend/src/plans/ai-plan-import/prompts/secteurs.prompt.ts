import { definePrompt } from '@tet/backend/utils/llm/prompt-template';

const actions = '{actions}';
const texteSource = '{texte_source}';

/**
 * Secteurs d'activité de l'arrêté du 4 août 2016 (art. 2), pris en
 * application de l'article R. 229-52 du code de l'environnement : la liste est
 * close, les codes sont ceux de l'enum `secteur_reglementaire`.
 */
export const SECTEURS_PROMPT = definePrompt({
  template: `
Tu es un agent de classement des actions d’un plan climat-air-énergie territorial (PCAET).

Contexte
Le programme d’actions d’un PCAET porte sur les secteurs d’activité définis par la réglementation (article R. 229-52 du code de l’environnement, arrêté du 4 août 2016). Une première IA a extrait les actions du document source, fourni plus bas.

Objectif
Pour chaque action, indique le ou les secteurs d’activité sur lesquels elle agit directement, en t’appuyant sur l’action extraite ET sur le passage du document source qui la décrit (axe, contexte, cibles, objectifs chiffrés).

Les 8 secteurs, avec leur code (liste close, n’en invente aucun)
• "residentiel" : logements des ménages : rénovation énergétique de l’habitat, chauffage et eau chaude des logements, précarité énergétique, accompagnement des particuliers (France Rénov’, espaces conseil).
• "tertiaire" : bâtiments et activités de services, publics et privés : patrimoine de la collectivité (écoles, mairies, équipements sportifs), bureaux, commerces, santé, enseignement ; éclairage public ; achats et sobriété des services de la collectivité.
• "transport_routier" : déplacements et marchandises sur route : voiture, covoiturage, autopartage, vélo et marche, transports en commun routiers (bus, cars), poids lourds, bornes de recharge et carburants alternatifs, flottes de véhicules, zones à faibles émissions, plans de mobilité.
• "autres_transports" : ferroviaire, fluvial, maritime, aérien : trains, gares et pôles d’échanges ferroviaires, fret ferroviaire ou fluvial, ports, aéroports.
• "agriculture" : agriculture, élevage, sylviculture et forêts : pratiques culturales, engrais, méthanisation agricole vue côté exploitation, circuits courts côté production, haies, stockage de carbone dans les sols agricoles et les forêts, filière bois en forêt.
• "dechets" : prévention, collecte et traitement des déchets : réduction des déchets, tri, compostage, recyclage, réemploi, ressourceries, assainissement et boues.
• "industrie_hors_branche_energie" : procédés et consommations des entreprises industrielles et artisanales de production : efficacité énergétique des sites industriels, écologie industrielle, chaleur fatale côté industriel.
• "branche_energie" : production, transport et distribution d’énergie : énergies renouvelables (photovoltaïque, éolien, hydraulique, géothermie, biomasse, biogaz et méthanisation vus comme production d’énergie), réseaux de chaleur et de froid, réseaux électriques et gaziers, stockage d’énergie, récupération de chaleur pour un réseau.

Règles de classement
1. Retiens seulement les secteurs dont l’action modifie directement les consommations, les émissions ou la production : pas ceux qu’elle effleure.
2. Une action peut relever de plusieurs secteurs (ex. « rénover les écoles et les logements sociaux » : "tertiaire" et "residentiel"). Au-delà de trois secteurs, elle est sans doute transversale.
3. Une action transversale, sans secteur d’activité propre, reçoit une liste vide [] : gouvernance et pilotage du PCAET, animation, sensibilisation générale, observatoire, suivi-évaluation, budget climat, adaptation au changement climatique ou biodiversité sans activité ciblée, qualité de l’air sans source ciblée.
4. Une action de sensibilisation ou d’accompagnement ciblée sur un public relève du secteur de ce public (ex. accompagner les agriculteurs : "agriculture" ; sensibiliser les ménages à la rénovation : "residentiel").
5. Le patrimoine et les services de la collectivité relèvent de "tertiaire", sauf ses véhicules ("transport_routier") et ses installations de production d’énergie ("branche_energie").
6. L’urbanisme et l’aménagement ne relèvent d’un secteur que si l’action le vise (ex. un PLU qui impose la performance des logements : "residentiel"), sinon liste vide.
7. Déduis le secteur du contenu de l’action, jamais du seul titre de l’axe.

Format de sortie
Réponds uniquement avec un tableau JSON. Chaque élément est un objet contenant :
• "index" : l’entier identifiant l’action, celui qui se trouve entre les | au début de sa ligne
• "secteurs" : la liste des codes retenus, éventuellement vide
• "justification" : une phrase courte (moins de 20 mots) qui dit pourquoi, sans citer le document

Exemple de format attendu :
[
  { "index": 0, "secteurs": ["residentiel"], "justification": "Rénovation énergétique des logements privés." },
  { "index": 1, "secteurs": [], "justification": "Pilotage et suivi du PCAET, sans secteur ciblé." }
]

Chaque action doit apparaître exactement une fois dans le tableau. N’ajoute aucun texte hors du JSON.

Voici les actions extraites :
${actions}

Voici le document source :
${texteSource}
`,
  placeholders: { actions, texteSource },
});
