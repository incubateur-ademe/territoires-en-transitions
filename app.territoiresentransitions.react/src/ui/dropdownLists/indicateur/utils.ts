// import {Indicateurs} from '@/api';
import { CategorieProgramme } from '@/api/indicateurs';
import { categorieProgrammeEnumSchema } from '@/api/indicateurs/domain';

const categorieEnum = categorieProgrammeEnumSchema.enum;

export function getCategorieLabel(categorieNom: CategorieProgramme) {
  switch (categorieNom) {
    case categorieEnum.cae:
      return 'Référentiel ADEME CAE';
    case categorieEnum.eci:
      return 'Référentiel ADEME ECI';
    case categorieEnum.crte:
      return 'Indicateurs Contrat de relance et de transition écologique (CRTE)';
    case categorieEnum.clef:
      return 'Indicateurs clés';
  }
}
