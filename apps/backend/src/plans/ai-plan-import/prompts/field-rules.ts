import { describeTabularStatutTable } from '../pipeline/analyze-workbook/map-tabular-statut';

/**
 * Règles communes à la lecture du document entier (extraction) et à celle
 * par extraits (structuration) : un même plan doit donner les mêmes fiches
 * quel que soit le fournisseur.
 */

export const NON_ACTION_PASSAGES_RULE = `Un passage qui évalue, commente ou cite des actions sans les définir (évaluation environnementale, analyse d'incidences, mesures ERC d'évitement-réduction-compensation, tableau d'indicateurs de suivi) : n'en tirez aucune action, même s'il en reprend les titres.`;

export const PARTNER_COMMITMENTS_RULE = `Ce qu'une entreprise, une association ou une autre institution s'engage à faire de son côté (charte, contribution de partenaire, liste d'engagements signés) n'est pas une action de la collectivité : n'en tirez aucune action.`;

export const FIELD_ALLOCATION_RULE = `Chaque information de la fiche va dans un seul champ, le plus spécialisé : objectifs, sous-actions, pilotes, partenaires, budget, financements, moyens, dates, statut. En cas de doute, le champ spécialisé plutôt que "description".`;

export const DESCRIPTION_RULE = `"description" : seulement le texte qui présente l'action (contexte, enjeux, contenu) et n'a sa place dans aucun autre champ, repris fidèlement, sans le résumer ni le reformuler. Jamais : les objectifs, cibles ou trajectoires chiffrées ; les sous-actions, étapes ou leviers ; les pilotes, porteurs ou référents ; les partenaires ou financeurs ; le budget, les montants, financements ou moyens ; le calendrier ; les indicateurs ; le statut ; un libellé de cartouche ou de tableau (« Commission », « Référent interne », « Structure porteuse », « Objectifs », « Trajectoire »…) ; la répétition du titre. "" si rien ne reste.`;

export const SOUS_ACTIONS_RULE = `"sous-actions" : les choses à faire pour mener l'action (étapes, leviers, chantiers), une par libellé court de 300 caractères au plus ; un passage long se résume en un libellé concis. Un objectif n'est jamais une sous-action : ce que l'action vise, une cible ou un résultat attendu (souvent sous « Objectifs », « Enjeux », « Trajectoire ») va dans "objectifs", même tourné avec un verbe (« Réduire l'utilisation des pesticides »). [] si la fiche n'en présente pas.`;

export const OBJECTIFS_RULE = `"objectifs" : ce que vise l'action, tel que le document le dit : l'énoncé d'objectif ("OBJECTIF : …"), les résultats attendus, les trajectoires ("2030 : -10 % par rapport à 2015") et surtout toutes les cibles chiffrées de la fiche (pourcentages, montants, quantités, nombres, avec leur horizon et leur valeur de départ quand elle est donnée). Dans une fiche mise en page, ces chiffres clés sont souvent en encadrés : le chiffre et son libellé arrivent éclatés sur plusieurs lignes, mêlés au texte voisin ; recomposez chaque chiffre avec son libellé ("75 % : score visé pour la labellisation Cit'ergie Gold en 2030 (62 % en 2014)"). Un élément par ligne, précédé de "- ". Ne reprenez pas la description, n'inventez aucun chiffre.`;

export const CARTOUCHE_RULE = `Un cartouche ou un tableau de fiche (libellés d'un côté, valeurs de l'autre) arrive souvent lu colonne par colonne : tous les libellés, puis toutes les valeurs. Rapprochez une valeur de son libellé quand la correspondance est sûre, et rangez-la dans son champ ; un libellé seul, ou une valeur que vous ne savez pas rattacher, ne va nulle part, surtout pas dans "description".`;

/**
 * Règles nées de plans hors PCAET (mobilité, PAT, COT, PLPDMA, biodiversité) :
 * elles tiennent à la forme du document, pas à son type, et valent pour tous.
 */

export const ACTION_LEVEL_RULE = `L'action est le niveau du document qui porte ses propres porteur ou pilote, partenaires ou budget. Un niveau au-dessus qui ne fait que regrouper de tels éléments n'est pas une action, même s'il s'appelle « mesure » ou « groupe d'actions » : "Mesure 1.1 Développer l'usage du vélo" suivie de "A – Organiser des bourses à vélo" et "B – Soutenir la réparation de vélos", chacune avec son porteur et ses partenaires, donne deux actions (A et B) dont le sous-axe est "1.1 Développer l'usage du vélo" ; de même "Groupe d'actions 1.2" suivi de puces qui ont chacune leur "Coût :" et leurs "Partenaires :". À l'inverse, les étapes d'une fiche qui n'a qu'un pilote et qu'un budget pour l'ensemble restent ses sous-actions, même quand chacune a sa date.`;

export const OTHER_PLAN_PASSAGES_RULE = `N'extrayez que les actions du plan lui-même. Ne donnent aucune action : les fiches d'un autre plan reproduites en annexe ou citées en lien ("Annexe : fiches actions du PCAET", "Autre fiche action en lien : PCAET 0.0.1 …") ; le bilan d'un programme précédent ("Actions déjà mises en place", "Résultats et analyse") ; l'état des lieux de ce qui est déjà fait, souvent suivi d'un renvoi aux fiches du plan ("Création du jardin, inauguré en 2021", "➔ Fiches actions 18, 27") : seules ces fiches sont des actions ; le compte rendu d'une concertation ou d'une consultation publique (avis, contributions et propositions du public) ; une fiche modèle qui explique comment lire les fiches ("A1. Titre de l'action", "Sous action 1.").`;

export const COLUMN_TABLE_RULE = `Un tableau à plusieurs colonnes ("Enjeu | Objectifs | Actions | Portage | Réalisation") arrive souvent lu ligne par ligne, toutes colonnes mêlées : une même ligne peut coller la fin d'un objectif, le début d'une action et le nom d'un organisme. Repérez d'abord les actions à leur numéro ("A 1 :", "A 2 :"), recomposez le titre de chacune sur ses lignes, puis rattachez-lui le porteur et la période écrits à sa hauteur. Les fragments des autres colonnes donnent l'axe, le sous-axe ou les objectifs : jamais un morceau de titre, jamais une action. Un titre recomposé se lit comme une phrase entière : s'il s'arrête sur un mot de liaison ("… au sein du projet de"), sa fin est sur une ligne voisine ; un mot sans rapport au milieu (une année, un nom d'organisme) vient d'une autre colonne.`;

export const FIELD_LABELS_RULE = `Les libellés varient d'un plan à l'autre : "Portage", "Porteur(s)", "Maître d'ouvrage", "Pilote(s) de l'action" désignent les pilotes ; "Services", "Service(s) référent(s)", "Direction(s)" la "direction ou service pilote", jamais la "structure pilote" ; "Coût", "Investissement", "Fonctionnement", "Moyens financiers" le budget ; "Résultat attendu", "Objectif(s) quantifié(s)" les objectifs. "Public ciblé", "Cibles", "Territoires concernés", "Gisement impacté", "Flux concerné", "Élu·e référent·e" n'ont pas de champ : gardez-les à la fin de "description", libellé compris ("Public ciblé : les ménages avec jardin"). Une étiquette entre crochets à la fin d'un titre ("[Structurante]", "[Sensibilisation]") n'en fait pas partie : retirez-la du titre. Un libellé n'est jamais une valeur : "Territoires concernés", "Partenaires" ou "Moyens humains" écrits sans rien à leur suite, ou suivis de pointillés, ne remplissent aucun champ, et le mot d'un libellé ("humain" de "Moyens humains", "Habitants" de "Public ciblé : habitants") ne va ni dans "moyens humains" ni dans "partenaires".`;

export const OPEN_ENDED_DATES_RULE = `"2025 et années suivantes", "À partir de 2024", "Dès 2023" donnent une date de début au 01/01 de l'année et aucune date de fin. "Court terme", "Moyen terme", "Long terme", "Annuelle", "Tout au long du programme", "Au fil de l'eau" ne sont pas des dates : laissez les deux dates à "".`;

/** Le cas d'un import réel : toute la fiche recopiée en description. */
export const FIELD_ALLOCATION_EXAMPLE = `Texte source (cartouche lu colonne par colonne, puis le corps de la fiche) :
"NOUVELLE
Commission
Référent interne
Structure porteuse Partenaires/Financeurs
Communauté de communes X
Economie A définir
Chambre d'agriculture, SAFER
Objectifs
Réduire l'utilisation des pesticides ;
Maintenir les prairies permanentes ;
Trajectoire
2030 : réduction des émissions de GES de 10 % par rapport à 2015
Le marais compte 300 exploitations, dont la moitié en élevage extensif.
1) Agir pour améliorer les pratiques agricoles locales
2) Expérimenter de nouvelles pratiques agricoles
Budget : 115 000 € (Plan de relance, LEADER)"
Mauvaise sortie : "description" recopie tout ce texte, et "sous-actions" contient "Réduire l'utilisation des pesticides" et "Maintenir les prairies permanentes".
Bonne sortie : "description" : "Le marais compte 300 exploitations, dont la moitié en élevage extensif." ; "objectifs" : "- Réduire l'utilisation des pesticides\\n- Maintenir les prairies permanentes\\n- 2030 : réduction des émissions de GES de 10 % par rapport à 2015" ; "sous-actions" : ["Agir pour améliorer les pratiques agricoles locales", "Expérimenter de nouvelles pratiques agricoles"] ; "structure pilote" : "Communauté de communes X" ; "partenaires" : "Chambre d'agriculture, SAFER" ; "budget" : "115000" ; "financements" : "Plan de relance, LEADER" ; "statut" : "À venir". « Commission », « Référent interne » et « Economie A définir » ne vont nulle part.`;

export const PILOTES_RULE = `"structure pilote" : l'organisme englobant (la collectivité, "Chambre d'agriculture", "DDT"…) ; "direction ou service pilote" : l'entité interne ("Service urbanisme", "Direction de la transition écologique"). "Service urbanisme de la Collectivité X" donne "Collectivité X" et "Service urbanisme". Plusieurs entités : séparées par ", ". Sans libellé "Pilote :", les acteurs d'une fiche sont souvent listés ou dessinés en schéma (porteurs, contributeurs, acteurs mobilisés) : les organismes cités vont dans "structure pilote", la collectivité en premier ; les directions, services ou agents internes cités ("Directions et agents") vont dans "direction ou service pilote". Un sigle ("CMC", "CCPF") est repris tel qu'il est écrit : ne le développez jamais en un nom que le document ne donne pas ("CMC" ne devient pas "Communauté de communes"). Plusieurs porteurs ("CAR SAFER / CCPF") vont tous dans "structure pilote" ; un porteur n'est jamais répété dans "partenaires".`;

export const BUDGET_RULE = `"budget" : le coût total de l'action en euros, entier sans séparateur ("115000"), sinon "". Un montant par an ("20 000 €/an"), un coût unitaire, une fourchette ou des recettes ne sont pas un total : laissez "budget" à "" et reprenez le montant tel qu'il est écrit, avec son unité, dans "financements".`;

// La période du plan entier faisait passer toutes les actions « En cours ».
export const buildStatutRule = (dateDuJour: string): string =>
  `"statut" : l'une des valeurs "À venir", "A discuter", "En cours", "Réalisé", "En retard", "En pause", "Bloqué", "Abandonné", sinon "". "Engagée", "Déjà engagée", "À poursuivre", "En cours de réalisation" donnent "En cours" ; "À initier", "Nouvelle", "À lancer", "Programmée", "Prévue" donnent "À venir" ; "Réalisée", "Terminée", "Achevée" donnent "Réalisé" ; "Abandonnée" donne "Abandonné" ; dans un tableau de suivi, ${describeTabularStatutTable()}. Sans statut explicite mais avec un calendrier propre à l'action, déduisez "À venir" ou "En cours" d'après la date du jour (${dateDuJour}) ; une année seule vaut "En cours" si c'est l'année actuelle, "À venir" si elle est future. La période du plan entier ("PCAET 2025-2030") n'est le calendrier d'aucune action : sans statut écrit ni calendrier propre à l'action, laissez "".`;

/** Pour un tableur seulement : le modèle y lit des rangées, pas des pages. */
export const SPREADSHEET_RULE = `Le texte vient d'un tableur. Chaque onglet commence par « [Onglet « nom »] » ; chaque rangée tient sur une ligne, ses colonnes séparées par des tabulations, sous la ligne d'en-tête qui les nomme. Une valeur fusionnée sur plusieurs rangées n'est écrite qu'à sa première rangée : les rangées suivantes, vides dans cette colonne, lui appartiennent ; un repère « [Suite de : …] » rappelle les valeurs fusionnées en cours au début d'un extrait. Une colonne dont chaque valeur couvre plusieurs rangées est un regroupement (axe, sous-axe) ou la fiche elle-même ; une colonne qui change à chaque rangée sous une même fiche en donne les sous-actions, pas des fiches. Une rangée isolée qui ne remplit qu'une cellule, au-dessus des autres, est un titre d'axe. Les libellés d'en-tête peuvent être décalés d'une colonne : fiez-vous au contenu d'une colonne plutôt qu'à son libellé. Une case de statut vide ne donne aucun statut, même avec un calendrier coché. Un onglet d'indicateurs, de valeurs cibles, de synthèse ou de liste de valeurs, et une rangée de totaux, ne donnent aucune action.`;
