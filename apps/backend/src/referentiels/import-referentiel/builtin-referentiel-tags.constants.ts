import {
  ReferentielIdEnum,
  ReferentielLabelEnum,
  ReferentielTag,
  ReferentielTagTypeEnum,
} from '@tet/domain/referentiels';
import { ImportActionDefinitionCoremeasureType } from './import-action-definition.dto';

/**
 * Tags attribués par l'import lui-même (origine, labels, coremeasure) :
 * ils ne peuvent pas être redéfinis depuis l'onglet `Tags` du spreadsheet
 */
export const BUILTIN_REFERENTIEL_TAGS: ReferentielTag[] = [
  {
    ref: ReferentielIdEnum.CAE,
    nom: 'CAE',
    type: ReferentielTagTypeEnum.CATALOGUE,
  },
  {
    ref: ReferentielIdEnum.ECI,
    nom: 'ECI',
    type: ReferentielTagTypeEnum.CATALOGUE,
  },
  {
    ref: ImportActionDefinitionCoremeasureType.COREMEASURE,
    nom: 'EEA Coremeasure',
    type: ReferentielTagTypeEnum.EEA,
  },
  {
    ref: ReferentielLabelEnum.TE_ECI,
    nom: 'Label TE ECI',
    type: ReferentielTagTypeEnum.LABEL,
  },
  {
    ref: ReferentielLabelEnum.TE_CAE,
    nom: 'Label TE CAE',
    type: ReferentielTagTypeEnum.LABEL,
  },
];
