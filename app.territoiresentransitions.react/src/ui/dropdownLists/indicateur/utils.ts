import {Indicateurs} from '@tet/api';

const categorieEnum = Indicateurs.domain.categorieProgrammeEnumSchema.enum;

export function getCategorieLabel(
  categorieNom: Indicateurs.domain.CategorieProgramme
) {
  switch (categorieNom) {
    case categorieEnum.cae:
      return 'Référentiel ADEME CAE';
    case categorieEnum.eci:
      return 'Référentiel ADEME ECI';
    case categorieEnum.crte:
      return 'CRTE';
    case categorieEnum.clef:
      return 'Indicateurs clés';
  }
}
