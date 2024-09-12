import { SousThematiqueType } from '../../taxonomie/models/sous-thematique.table';
import { IndicateurDefinitionType } from '../../indicateurs/models/indicateur-definition.table';
import { SousThematique } from '../../directus/models/directus.models';

export type Datas = {
  sousThematiques: Map<string, SousThematiqueType>;
  indicateurs: Map<string, IndicateurDefinitionType>;
  sousThematiquesDirectus: SousThematique[];
};
