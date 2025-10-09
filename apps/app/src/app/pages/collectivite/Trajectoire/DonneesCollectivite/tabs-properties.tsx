import { IndicateurTrajectoireId } from '@/app/indicateurs/trajectoires/trajectoire-constants';

export const tabsProperties: Array<{
  id: IndicateurTrajectoireId;
  label: string;
  description: string;
}> = [
  {
    id: 'emissions_ges',
    label: 'Données GES 2015 (ktCO2)',
    description:
      "Pour assurer la cohérence des calculs, n'entrer ici que les valeurs au format PCAET. Pour ces données, nous recommandons d’utiliser les données issues de votre observatoire. Pour vous faciliter ce travail, les données disponibles en open data sont affichées dans le tableau suivant. Si disponibles, privilégiez les données RARE-OREC et utilisez les données CITEPA uniquement en complément.",
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
    description:
      'Pour ces données, nous recommandons d’utiliser les données issues de votre observatoire. Pour vous faciliter ce travail, les données disponibles en open data sont affichées dans le tableau suivant.',
  },
];
