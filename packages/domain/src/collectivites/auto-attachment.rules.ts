import {
  CollectiviteType,
  collectiviteTypeEnum,
} from './collectivite-type.enum';

/**
 * Les collectivités qu'un agent rejoint sur la seule foi de son identité : son
 * fournisseur d'identité a déjà attesté qu'il y travaille, et l'organisation
 * qu'il a choisie à la connexion désigne le service.
 *
 * Un prédicat **distinct** de ses deux voisins, même quand les listes
 * coïncident :
 * - `isServiceDeconcentre` (`./service-deconcentre.rules`) dit qui n'a pas
 *   d'espace de collectivité propre, et exclut le conseil régional — qui, lui,
 *   se rejoint bien par ProConnect ;
 * - `isTypeInstructeur` (`@tet/domain/demarches`) dit qui voit les dossiers
 *   transmis, et porte aujourd'hui les mêmes types par coïncidence.
 *
 * S'appuyer sur l'un des deux ouvrirait en silence l'auto-rattachement au
 * prochain type qu'on y ajouterait. Une commune n'est pas ici : son parcours
 * reste l'invitation, parce que rien ne garantit qu'un agent public en soit
 * l'employé.
 */
const autoAttachableTypes: readonly CollectiviteType[] = [
  collectiviteTypeEnum.DREAL,
  collectiviteTypeEnum.DDT,
  collectiviteTypeEnum.DR_ADEME,
  collectiviteTypeEnum.SERVICE_NATIONAL,
  collectiviteTypeEnum.REGION,
];

export const isAutoAttachableType = (type: CollectiviteType): boolean =>
  autoAttachableTypes.includes(type);

/**
 * Les domaines de messagerie exigés pour entrer automatiquement chez un
 * employeur, déclarés par SIREN.
 *
 * Le SIREN et non le type : la DGEC et l'ADEME nationale sont deux
 * `service_national`, et rien ne dit que leurs agents partagent un domaine. Ce
 * qu'on contraint, c'est l'employeur, et c'est le SIREN qui le nomme.
 *
 * Un second verrou, volontairement redondant avec le SIRET du jeton. Il vaut
 * pour le jour où le fournisseur d'identité se tromperait d'organisation : le
 * SIRET du siège de l'ADEME désigne un service à périmètre national,
 * destinataire de toute transmission PCAET, et une erreur de sa part y ferait
 * entrer n'importe qui. Une adresse ne franchit pas ce verrou par erreur.
 */
const domainesRequisParSiren: Record<string, readonly string[]> = {
  // L'ADEME : ses directions régionales et l'ADEME nationale partagent ce SIREN.
  '385290309': ['ademe.fr'],
};

/** Le domaine d'une adresse, en minuscules, ou `null` si elle n'en a pas. */
const domaineDeEmail = (email: string): string | null => {
  const separateur = email.lastIndexOf('@');
  if (separateur < 0 || separateur === email.length - 1) {
    return null;
  }
  return email
    .slice(separateur + 1)
    .trim()
    .toLowerCase();
};

/**
 * Cette adresse permet-elle d'entrer automatiquement chez cet employeur ?
 *
 * Vraie par défaut : la plupart des employeurs n'imposent aucun domaine, et
 * c'est alors l'organisation du jeton qui fait foi. Là où un domaine est
 * déclaré, la correspondance est **exacte** — un sous-domaine ne passe pas,
 * faute de savoir lesquels sont légitimes.
 */
export const canAutoAttachEmail = ({
  siren,
  email,
}: {
  siren: string | null;
  email: string;
}): boolean => {
  const domainesRequis = siren ? domainesRequisParSiren[siren] : undefined;
  if (!domainesRequis) {
    return true;
  }
  const domaine = domaineDeEmail(email);
  return domaine !== null && domainesRequis.includes(domaine);
};
