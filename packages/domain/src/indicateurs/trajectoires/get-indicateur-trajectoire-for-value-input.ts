import { CONSOMMATIONS_FINALES_PROPERTIES } from './consommations-finales-properties';
import { EMISSIONS_GES_PROPERTIES } from './ges-emissions-properties';
import { TrajectoireSecteursType } from './trajectoire-secteurs';
import { SEQUESTRATION_CARBONE_PROPERTIES } from './trajectoires-carbon-sequestration-properties';
import { TrajectoirePropertiesType } from './types';

// Common secteurs names, matching domain secteurs values
const COMMON_SECTEURS: readonly TrajectoireSecteursType[] = [
  'Résidentiel',
  'Tertiaire',
  'Industrie',
  'Agriculture',
  'Déchets',
  'Branche énergie',
] as const;

const CONSOMMATIONS_FINALES_SPECIFIC_INPUT_SECTEURS: TrajectoirePropertiesType['secteurs'] =
  [{ nom: 'Transports', identifiant: 'transports' }];

const GES_SPECIFIC_INPUT_SECTEURS: TrajectoirePropertiesType['secteurs'] = [
  { nom: 'Transports', identifiant: 'transports' },
  { nom: 'UTCATF', identifiant: 'utcatf' },
  { nom: 'CSC', identifiant: 'csc' },
];

const toInputFormatSecteurs = (
  id: 'emissions_ges' | 'consommations_finales' | 'sequestration_carbone',
  secteurs: TrajectoirePropertiesType['secteurs']
): TrajectoirePropertiesType['secteurs'] => {
  if (id === 'sequestration_carbone') {
    return secteurs;
  }

  const specificSecteurs = {
    consommations_finales: CONSOMMATIONS_FINALES_SPECIFIC_INPUT_SECTEURS,
    emissions_ges: GES_SPECIFIC_INPUT_SECTEURS,
  }[id];

  const secteursToKeep = secteurs.filter((s) =>
    (COMMON_SECTEURS as readonly string[]).includes(s.nom)
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
