import { CollectiviteType, collectiviteTypeEnum } from '../../collectivites';

/**
 * Les organismes dont la DGEC désigne les référents PCAET, ceux que la
 * collectivité déposante voit comme contacts. La DR ADEME et les services
 * nationaux sont saisis aussi, mais ne sont pas des interlocuteurs du dépôt.
 */
export const typesOrganismeReferentPcaet: readonly CollectiviteType[] = [
  collectiviteTypeEnum.DREAL,
  collectiviteTypeEnum.REGION,
  collectiviteTypeEnum.DDT,
];

export const isOrganismeReferentPcaet = (type: CollectiviteType): boolean =>
  typesOrganismeReferentPcaet.includes(type);

/**
 * Par SIREN et non par type : l'ADEME nationale est elle aussi un
 * `service_national`.
 */
export const DGEC_SIREN = '120087010';

export const isDgec = ({
  type,
  siren,
}: {
  type: CollectiviteType;
  siren: string | null;
}): boolean =>
  type === collectiviteTypeEnum.SERVICE_NATIONAL && siren === DGEC_SIREN;
