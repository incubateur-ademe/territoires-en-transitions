import { IndicateurSourceEnum } from './indicateur-source.enum';
import { TrajectoirePropertiesType } from './types';

export const CarbonSequestrationSecteursEnum = [
  'Cultures',
  'Prairies',
  'Zones Humides',
  'Vergers',
  'Vignes',
  'Sols Artificiels',
  'Forêts',
  'Produits Bois',
] as const;

export type CarbonSequestrationSecteurEnum =
  (typeof CarbonSequestrationSecteursEnum)[number];

const SEQUESTRATION_CARBONE_SECTEURS: {
  nom: CarbonSequestrationSecteurEnum;
  identifiant: string;
}[] = [
  { nom: 'Cultures', identifiant: 'cae_63.ca' },
  { nom: 'Prairies', identifiant: 'cae_63.cb' },
  { nom: 'Zones Humides', identifiant: 'cae_63.da' },
  { nom: 'Vergers', identifiant: 'cae_63.cd' },
  { nom: 'Vignes', identifiant: 'cae_63.cc' },
  { nom: 'Sols Artificiels', identifiant: 'cae_63.db' },
  { nom: 'Forêts', identifiant: 'cae_63.b' },
  { nom: 'Produits Bois', identifiant: 'cae_63.e' },
];

const SEQUESTRATION_CARBONE_SOURCES = [
  IndicateurSourceEnum.ALDO,
  IndicateurSourceEnum.COLLECTIVITE,
];

export const SEQUESTRATION_CARBONE_PROPERTIES: TrajectoirePropertiesType<CarbonSequestrationSecteurEnum> =
  {
    identifiant: '',
    unite: '',
    sources: SEQUESTRATION_CARBONE_SOURCES,
    secteurs: SEQUESTRATION_CARBONE_SECTEURS,
  };
