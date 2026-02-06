import EvolutionFiches, { useEvolutionFiches } from './EvolutionFiches';
import { ChartHead, ChartTitle } from './headings';

type EvolutionPlansActionProps = {
  region?: string;
  department?: string;
};

export function EvolutionPlansAction({
  region = '',
  department = '',
}: EvolutionPlansActionProps) {
  const { data: collectivites } = useEvolutionFiches(
    'stats_locales_evolution_collectivite_avec_minimum_fiches',
    region,
    department
  );
  const { data: fiches } = useEvolutionFiches(
    'stats_locales_evolution_nombre_fiches',
    region,
    department
  );
  const { data: plans } = useEvolutionFiches(
    'stats_evolution_nombre_plans',
    region,
    department
  );

  return (
    <>
      {collectivites && fiches && plans && (
        <ChartHead>
          <>
            Évolution de l&apos;utilisation des plans
            <br />
            {collectivites.last} collectivité
            {collectivites.last !== 1 && 's'}
            {collectivites.last === 1 ? ' a ' : ' ont '}
            créé {plans.last} plan{plans.last !== 1 && 's'} et {fiches.last}{' '}
            action
            {fiches.last !== 1 && 's'}
          </>
        </ChartHead>
      )}
      <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
        {collectivites && (
          <div className="fr-col-xs-12 fr-col-sm-12 fr-col-md-6 fr-col-lg-6 fr-ratio-16x9">
            <ChartTitle>Nombre de collectivités avec 5+ actions</ChartTitle>
            <EvolutionFiches
              vue="stats_locales_evolution_collectivite_avec_minimum_fiches"
              region={region}
              department={department}
            />
          </div>
        )}
        {fiches && (
          <div className="fr-col-xs-12 fr-col-sm-12 fr-col-md-6 fr-col-lg-6 fr-ratio-16x9">
            <ChartTitle>{"Nombre d'actions créées"}</ChartTitle>
            <EvolutionFiches
              vue="stats_locales_evolution_nombre_fiches"
              region={region}
              department={department}
            />
          </div>
        )}
        {plans && region === '' && department === '' && (
          <div className="fr-col-xs-12 fr-col-sm-12 fr-col-md-6 fr-col-lg-6 fr-ratio-16x9">
            <ChartTitle>Historique du nombre de plans</ChartTitle>
            <EvolutionFiches
              vue="stats_evolution_nombre_plans"
              region={region}
              department={department}
            />
          </div>
        )}
      </div>
    </>
  );
}
