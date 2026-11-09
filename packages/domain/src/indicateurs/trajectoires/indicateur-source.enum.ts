export enum IndicateurSourceEnum {
  COLLECTIVITE = 'collectivite',
  RARE = 'rare',
  PCAET = 'pcaet',
  CITEPA = 'citepa',
  ALDO = 'aldo',
  SNBC = 'snbc',
  SNBC3 = 'snbc3',
}

/**
 * Sources de trajectoire : elles sont exclues des traitements génériques
 * (moyenne des collectivités, drapeau « open data »), qui ne portent que sur
 * des valeurs observées.
 */
export const SOURCES_TRAJECTOIRE = [
  IndicateurSourceEnum.SNBC,
  IndicateurSourceEnum.SNBC3,
] as const;
