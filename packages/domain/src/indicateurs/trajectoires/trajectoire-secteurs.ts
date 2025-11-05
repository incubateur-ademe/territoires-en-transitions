import { createEnumObject } from '../../utils/enum.utils';

export const trajectoireSecteursEnumValues = [
  'Résidentiel',
  'Tertiaire',
  'Industrie',
  'Agriculture',
  'Transports',
  'Déchets',
  'Branche énergie',
  'UTCATF',
  'CSC',
] as const;

export const TrajectoireSecteursEnum = createEnumObject(
  trajectoireSecteursEnumValues
);
export type TrajectoireSecteursType =
  (typeof trajectoireSecteursEnumValues)[number];

export const isTrajectoireSecteur = (
  secteur: string
): secteur is TrajectoireSecteursType => {
  return trajectoireSecteursEnumValues.includes(
    secteur as TrajectoireSecteursType
  );
};
