/**
 * La date de la délibération d'adoption : celle qui fait courir les six ans de
 * validité du PCAET, et le seul champ saisi à la validation du dépôt final.
 *
 * Une délibération est un acte **déjà pris** : elle ne peut pas être datée du
 * futur. Antidater reste possible, et légitime — une collectivité dépose son
 * dossier des semaines après le conseil qui l'a adopté.
 *
 * La règle vit ici, et non dans le seul `max` de l'input du formulaire : un
 * attribut HTML ne protège pas un appel direct à la mutation, et décaler
 * l'adoption vers l'avant décalerait d'autant la fin de validité — donc
 * l'échéance de renouvellement que la plateforme surveille.
 */

/**
 * Date civile de référence : celle de Paris, et non celle du serveur.
 *
 * Une délibération française se date dans son propre calendrier. Sur un serveur
 * en UTC, un conseil tenu le 3 au soir tombe déjà le 4 pour le fuseau local :
 * comparer en UTC ferait refuser une date parfaitement valide pendant les deux
 * premières heures de chaque journée.
 */
export const getDateCivileFrance = (now: Date): string =>
  // `sv-SE` est le format ISO 8601 (AAAA-MM-JJ) sans passer par une découpe
  // manuelle de l'ISO UTC, qui perdrait justement le fuseau.
  new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris' }).format(now);

/**
 * La date d'adoption est-elle recevable ? Les deux bornes sont des dates
 * civiles (AAAA-MM-JJ) : leur ordre lexicographique est leur ordre
 * chronologique, aucune conversion n'est nécessaire.
 */
export const isDateAdoptionPcaetRecevable = (
  dateAdoption: string,
  dateReference: string
): boolean => dateAdoption <= dateReference;
