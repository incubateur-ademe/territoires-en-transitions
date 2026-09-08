import {
  CollectiviteType,
  collectiviteTypeEnum,
} from './collectivite-type.enum';

/**
 * Les collectivités qu'un agent rejoint sur la seule foi de son identité.
 *
 * Distinct de `isServiceDeconcentre` (qui exclut le conseil régional) et de
 * `isTypeInstructeur` (qui porte les mêmes types par coïncidence) : s'appuyer
 * sur l'un des deux ouvrirait en silence le rattachement au prochain type
 * qu'on y ajouterait.
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
 * Par SIREN et non par type : la DGEC et l'ADEME nationale sont deux
 * `service_national` sans domaine commun. C'est l'employeur qu'on contraint.
 */
const domainesRequisParSiren: Record<string, readonly string[]> = {
  // L'ADEME : ses directions régionales et l'ADEME nationale partagent ce SIREN.
  '385290309': ['ademe.fr'],
};

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
 * Vraie par défaut : sans domaine déclaré, l'organisation du jeton fait foi.
 * Sinon la correspondance est **exacte** — un sous-domaine ne passe pas, faute
 * de savoir lesquels sont légitimes.
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
