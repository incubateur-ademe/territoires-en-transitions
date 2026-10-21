import { describeTabularStatutTable } from '../pipeline/analyze-workbook/map-tabular-statut';

/**
 * Règles communes à la lecture du document entier (extraction) et à celle
 * par extraits (structuration) : un même plan doit donner les mêmes fiches
 * quel que soit le fournisseur.
 */

export const NON_ACTION_PASSAGES_RULE = `Un passage qui évalue, commente ou cite des actions sans les définir (évaluation environnementale, analyse d'incidences, mesures ERC d'évitement-réduction-compensation, tableau d'indicateurs de suivi) : n'en tirez aucune action, même s'il en reprend les titres.`;

export const PARTNER_COMMITMENTS_RULE = `Ce qu'une entreprise, une association ou une autre institution s'engage à faire de son côté (charte, contribution de partenaire, liste d'engagements signés) n'est pas une action de la collectivité : n'en tirez aucune action.`;

export const DESCRIPTION_RULE = `"description" : le texte de l'action qui complète le titre, repris en entier et fidèlement : ne le résumez pas, ne le reformulez pas. Jamais la répétition du titre ; "" si le titre suffit.`;

export const OBJECTIFS_RULE = `"objectifs" : ce que vise l'action, tel que le document le dit : l'énoncé d'objectif ("OBJECTIF : …") et surtout toutes les cibles chiffrées de la fiche (pourcentages, montants, quantités, nombres, avec leur horizon et leur valeur de départ quand elle est donnée). Dans une fiche mise en page, ces chiffres clés sont souvent en encadrés : le chiffre et son libellé arrivent éclatés sur plusieurs lignes, mêlés au texte voisin ; recomposez chaque chiffre avec son libellé ("75 % : score visé pour la labellisation Cit'ergie Gold en 2030 (62 % en 2014)"). Un élément par ligne, précédé de "- ". Ne reprenez pas la description, n'inventez aucun chiffre.`;

export const PILOTES_RULE = `"structure pilote" : l'organisme englobant (la collectivité, "Chambre d'agriculture", "DDT"…) ; "direction ou service pilote" : l'entité interne ("Service urbanisme", "Direction de la transition écologique"). "Service urbanisme de la Collectivité X" donne "Collectivité X" et "Service urbanisme". Plusieurs entités : séparées par ", ". Sans libellé "Pilote :", les acteurs d'une fiche sont souvent listés ou dessinés en schéma (porteurs, contributeurs, acteurs mobilisés) : les organismes cités vont dans "structure pilote", la collectivité en premier ; les directions, services ou agents internes cités ("Directions et agents") vont dans "direction ou service pilote".`;

// La période du plan entier faisait passer toutes les actions « En cours ».
export const buildStatutRule = (dateDuJour: string): string =>
  `"statut" : l'une des valeurs "À venir", "A discuter", "En cours", "Réalisé", "En retard", "En pause", "Bloqué", "Abandonné", sinon "". "Engagée", "Déjà engagée", "À poursuivre", "En cours de réalisation" donnent "En cours" ; "À initier", "Nouvelle", "À lancer", "Programmée", "Prévue" donnent "À venir" ; "Réalisée", "Terminée", "Achevée" donnent "Réalisé" ; "Abandonnée" donne "Abandonné" ; dans un tableau de suivi, ${describeTabularStatutTable()}. Sans statut explicite mais avec un calendrier propre à l'action, déduisez "À venir" ou "En cours" d'après la date du jour (${dateDuJour}) ; une année seule vaut "En cours" si c'est l'année actuelle, "À venir" si elle est future. La période du plan entier ("PCAET 2025-2030") n'est le calendrier d'aucune action : sans statut écrit ni calendrier propre à l'action, laissez "".`;

/** Pour un tableur seulement : le modèle y lit des rangées, pas des pages. */
export const SPREADSHEET_RULE = `Le texte vient d'un tableur. Chaque onglet commence par « [Onglet « nom »] » ; chaque rangée tient sur une ligne, ses colonnes séparées par des tabulations, sous la ligne d'en-tête qui les nomme. Une valeur fusionnée sur plusieurs rangées n'est écrite qu'à sa première rangée : les rangées suivantes, vides dans cette colonne, lui appartiennent ; un repère « [Suite de : …] » rappelle les valeurs fusionnées en cours au début d'un extrait. Une colonne dont chaque valeur couvre plusieurs rangées est un regroupement (axe, sous-axe) ou la fiche elle-même ; une colonne qui change à chaque rangée sous une même fiche en donne les sous-actions, pas des fiches. Une rangée isolée qui ne remplit qu'une cellule, au-dessus des autres, est un titre d'axe. Les libellés d'en-tête peuvent être décalés d'une colonne : fiez-vous au contenu d'une colonne plutôt qu'à son libellé. Une case de statut vide ne donne aucun statut, même avec un calendrier coché. Un onglet d'indicateurs, de valeurs cibles, de synthèse ou de liste de valeurs, et une rangée de totaux, ne donnent aucune action.`;
