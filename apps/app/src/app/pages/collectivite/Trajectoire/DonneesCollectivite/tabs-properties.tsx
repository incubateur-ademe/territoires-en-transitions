import { IndicateurTrajectoireId } from '@/app/indicateurs/trajectoires/trajectoire-constants';
import {
  MINIMAL_NUMBER_OF_VALID_VALUES_FOR_CONSOMMATIONS_FINALES,
  MINIMAL_NUMBER_OF_VALID_VALUES_FOR_EMISSIONS_GES,
} from '@tet/domain/indicateurs';

export const tabsProperties: Array<{
  id: IndicateurTrajectoireId;
  label: string;
  description: string;
}> = [
  {
    id: 'emissions_ges',
    label: 'Données GES 2015 (ktCO2)',
    description: `Le calcul s'effectue à partir de ${MINIMAL_NUMBER_OF_VALID_VALUES_FOR_EMISSIONS_GES} valeurs d'une même source. Par défaut, les données issues de votre observatoire sont utilisées si disponibles.
Si vous souhaitez utiliser vos propres données, entrez vos valeurs au format PCAET pour assurer la cohérence des calculs.`,
  },
  {
    id: 'sequestration_carbone',
    label: 'Séquestration carbone 2015 (ktCO2)',
    description:
      'Les données sont attendues au format ALDO : positives en cas de séquestration et négatives en cas d’émission. Pour vous faciliter ce travail, les données disponibles en open data sont affichées dans le tableau suivant, à ce format. Il s’agit ici de renseigner les flux UTCATF et non les stocks.',
  },
  {
    id: 'consommations_finales',
    label: 'Consommation d’énergie 2015 (GWh)',
    description: `Le calcul s'effectue à partir de ${MINIMAL_NUMBER_OF_VALID_VALUES_FOR_CONSOMMATIONS_FINALES} valeurs d'une même source. Nous vous recommandons d'utiliser les données issues de votre observatoire, qui sont utilisés par défaut, et affichés dans le tableau suivant, si disponibles.`,
  },
];
