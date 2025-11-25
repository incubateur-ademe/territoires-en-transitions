import { CONSOMMATIONS_FINALES_SPECIFIC_INPUT_SECTEURS } from '@/backend/indicateurs/trajectoires/domain/consommations-finales-input-properties';
import { GES_SPECIFIC_INPUT_SECTEURS } from '@/backend/indicateurs/trajectoires/domain/ges-emissions-input-properties';
import {
  TrajectoireSecteursEnum,
  TrajectoireSecteursType,
} from '@/backend/indicateurs/trajectoires/domain/trajectoire-secteurs.enum';
import { SEQUESTRATION_CARBONE_PROPERTIES } from '@/backend/indicateurs/trajectoires/domain/trajectoires-carbon-sequestration-properties';
import { CONSOMMATIONS_FINALES_PROPERTIES } from './consommations-finales-properties';
import { EMISSIONS_GES_PROPERTIES } from './ges-emissions-properties';
import { TrajectoirePropertiesType } from './types';

const toInputFormatSecteurs = (
  id: 'emissions_ges' | 'consommations_finales' | 'sequestration_carbone',
  secteurs: TrajectoirePropertiesType['secteurs']
): TrajectoirePropertiesType['secteurs'] => {
  if (id === 'sequestration_carbone') {
    return secteurs;
  }

  const COMMON_SECTEURS: readonly TrajectoireSecteursType[] = [
    TrajectoireSecteursEnum.RÉSIDENTIEL,
    TrajectoireSecteursEnum.TERTIAIRE,
    TrajectoireSecteursEnum.INDUSTRIE,
    TrajectoireSecteursEnum.AGRICULTURE,
    TrajectoireSecteursEnum.DÉCHETS,
    TrajectoireSecteursEnum['BRANCHE ÉNERGIE'],
  ];

  const specificSecteurs = {
    consommations_finales: CONSOMMATIONS_FINALES_SPECIFIC_INPUT_SECTEURS,
    emissions_ges: GES_SPECIFIC_INPUT_SECTEURS,
  }[id];

  const secteursToKeep = secteurs.filter((s) =>
    COMMON_SECTEURS.includes(s.nom as TrajectoireSecteursType)
  );
  return [...secteursToKeep, ...specificSecteurs];
};

export const getIndicateurTrajectoireForValueInput = (
  id: 'emissions_ges' | 'consommations_finales' | 'sequestration_carbone'
) => {
  const INDICATEURS_TRAJECTOIRE = {
    sequestration_carbone: SEQUESTRATION_CARBONE_PROPERTIES,
    consommations_finales: CONSOMMATIONS_FINALES_PROPERTIES,
    emissions_ges: EMISSIONS_GES_PROPERTIES,
  }[id];

  return {
    ...INDICATEURS_TRAJECTOIRE,
    secteurs: toInputFormatSecteurs(id, INDICATEURS_TRAJECTOIRE.secteurs),
  };
};
