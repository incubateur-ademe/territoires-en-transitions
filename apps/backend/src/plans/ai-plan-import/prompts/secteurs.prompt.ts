import { definePrompt } from '@tet/backend/utils/llm/prompt-template';

const plan = '{plan}';
const contexte = '{contexte}';
const objectif = '{objectif}';
const consignes = '{consignes}';
const champs = '{champs}';
const exemple = '{exemple}';
const actions = '{actions}';
const texteSource = '{texte_source}';

/**
 * Un seul appel par lot : les secteurs réglementaires, demandés pour un
 * PCAET seulement, et les effets attendus, demandés pour tout plan.
 */
export const SECTEURS_PROMPT = definePrompt({
  template: `
Tu es un agent de classement des actions d’${plan}.

Contexte
${contexte}Une première IA a extrait les actions du document source, fourni plus bas.

Objectif
Pour chaque action, indique ${objectif}, en t’appuyant sur l’action extraite ET sur le passage du document source qui la décrit (axe, contexte, cibles, objectifs chiffrés).
${consignes}
Format de sortie
Réponds uniquement avec un tableau JSON. Chaque élément est un objet contenant :
• "index" : l’entier identifiant l’action, celui qui se trouve entre les | au début de sa ligne
${champs}

Exemple de format attendu :
${exemple}

Chaque action doit apparaître exactement une fois dans le tableau. N’ajoute aucun texte hors du JSON.

Voici les actions extraites :
${actions}

Voici le document source :
${texteSource}
`,
  placeholders: {
    plan,
    contexte,
    objectif,
    consignes,
    champs,
    exemple,
    actions,
    texteSource,
  },
});

/**
 * Les 8 secteurs d'activité de l'arrêté du 4 août 2016 (art. 2), pris en
 * application de l'article R. 229-52 du code de l'environnement, puis 7
 * thématiques : la liste est close, les codes sont ceux de l'enum
 * `secteur_reglementaire`.
 */
export const SECTEURS_CONSIGNES = `
Les 15 secteurs, avec leur code (liste close, n’en invente aucun)
Les 8 secteurs d’activité de la réglementation :
• "residentiel" : logements des ménages : rénovation énergétique de l’habitat, chauffage et eau chaude des logements, précarité énergétique, accompagnement des particuliers (France Rénov’, espaces conseil).
• "tertiaire" : bâtiments et activités de services, publics et privés : patrimoine de la collectivité (écoles, mairies, équipements sportifs), bureaux, commerces, établissements de santé et d’enseignement ; éclairage public ; achats et sobriété des services de la collectivité.
• "transport_routier" : déplacements et marchandises sur route : voiture, covoiturage, autopartage, vélo et marche, transports en commun routiers (bus, cars), poids lourds, bornes de recharge et carburants alternatifs, flottes de véhicules, zones à faibles émissions, plans de mobilité.
• "autres_transports" : ferroviaire, fluvial, maritime, aérien : trains, gares et pôles d’échanges ferroviaires, fret ferroviaire ou fluvial, ports, aéroports.
• "agriculture" : agriculture et élevage : pratiques culturales, engrais, méthanisation agricole vue côté exploitation, circuits courts côté production, haies et agroforesterie sur les exploitations.
• "dechets" : prévention, collecte et traitement des déchets : réduction des déchets, tri, compostage, recyclage, réemploi, ressourceries, assainissement et boues.
• "industrie_hors_branche_energie" : procédés et consommations des entreprises industrielles et artisanales de production : efficacité énergétique des sites industriels, écologie industrielle, chaleur fatale côté industriel.
• "branche_energie" : production, transport et distribution d’énergie : énergies renouvelables (photovoltaïque, éolien, hydraulique, géothermie, biomasse, biogaz et méthanisation vus comme production d’énergie), réseaux de chaleur et de froid, réseaux électriques et gaziers, stockage d’énergie, récupération de chaleur pour un réseau.
Les 7 thématiques :
• "amenagement" : urbanisme et aménagement du territoire : documents d’urbanisme (PLU, PLUi, SCoT), sobriété foncière et zéro artificialisation nette, renouvellement urbain, revitalisation des centres-bourgs, aménagement des espaces publics, îlots de fraîcheur.
• "biodiversite" : préservation et restauration des milieux naturels et des espèces : trames vertes et bleues, zones humides, espaces naturels protégés, nature en ville, espèces exotiques envahissantes, pollinisateurs, atlas de la biodiversité.
• "eau" : ressource en eau et milieux aquatiques : économies d’eau, partage de la ressource en période de sécheresse, eau potable, gestion des eaux pluviales, réutilisation des eaux usées, qualité des cours d’eau et des nappes.
• "foret_et_sols" : forêts, sylviculture et sols : gestion forestière durable, boisement et reboisement, filière bois en forêt, stockage de carbone dans les forêts et les sols, qualité et santé des sols, désimperméabilisation.
• "economie" : économie du territoire : accompagnement des entreprises et des filières dans la transition, économie circulaire et locale, tourisme durable, commerce de proximité, emplois et compétences de la transition.
• "sante" : santé des habitants : effets de la pollution de l’air et des fortes chaleurs sur la santé, qualité de l’air intérieur, allergènes (pollens, ambroisie), moustique tigre et maladies vectorielles, alimentation saine, publics vulnérables.
• "risques_naturels" : prévention des risques naturels et de leurs effets : inondations, submersion marine et recul du trait de côte, retrait-gonflement des argiles, feux de forêt, mouvements de terrain, plans communaux de sauvegarde, culture du risque.

Règles de classement des secteurs
1. Retiens un secteur d’activité seulement si l’action modifie directement ses consommations, ses émissions ou sa production, et une thématique seulement si l’action en fait son objet : pas ceux qu’elle effleure.
2. Une action peut relever de plusieurs secteurs, d’activité comme thématiques (ex. « rénover les écoles et les logements sociaux » : "tertiaire" et "residentiel" ; « restaurer les zones humides pour limiter les crues » : "biodiversite", "eau" et "risques_naturels"). Au-delà de trois secteurs, elle est sans doute transversale.
3. Une action transversale, sans secteur ni thématique propre, reçoit une liste vide [] : gouvernance et pilotage du PCAET, animation, sensibilisation générale, observatoire, suivi-évaluation, budget climat, stratégie d’adaptation sans thématique ciblée.
4. Une action de sensibilisation ou d’accompagnement ciblée sur un public relève du secteur de ce public (ex. accompagner les agriculteurs : "agriculture" ; sensibiliser les ménages à la rénovation : "residentiel").
5. Le patrimoine et les services de la collectivité relèvent de "tertiaire", sauf ses véhicules ("transport_routier") et ses installations de production d’énergie ("branche_energie").
6. L’urbanisme et l’aménagement relèvent de "amenagement", plus le secteur d’activité visé s’il y en a un (ex. un PLU qui impose la performance des logements : "amenagement" et "residentiel").
7. Déduis le secteur du contenu de l’action, jamais du seul titre de l’axe.
`;

const effetsAttendus = '{effets_attendus}';

export const EFFETS_ATTENDUS_CONSIGNES = definePrompt({
  template: `
Les effets attendus, avec leur identifiant (liste close, n’en invente aucun)
${effetsAttendus}

Règles de choix des effets attendus
1. Retiens les effets que l’action produit directement et de façon plausible au vu de son contenu et du passage du document source qui la décrit : en général de 1 à 3.
2. Ne retiens pas par défaut un effet générique (ex. la réduction des émissions de gaz à effet de serre) : seulement si l’action a un lien concret avec lui.
3. Si aucun effet ne s’impose, réponds avec une liste vide [].
4. Déduis les effets du contenu de l’action, jamais du seul titre de l’axe.
5. Réponds avec les identifiants numériques de la liste, jamais avec les noms.
`,
  placeholders: { effetsAttendus },
});
