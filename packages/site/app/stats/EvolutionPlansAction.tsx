import React from 'react';
import {ChartHead, ChartTitle} from './headings';
import EvolutionFiches, {useEvolutionFiches} from './EvolutionFiches';
import classNames from 'classnames';

type EvolutionPlansActionProps = {
  region?: string;
  department?: string;
};

export function EvolutionPlansAction({
  region = '',
  department = '',
}: EvolutionPlansActionProps) {
  const {data: collectivites} = useEvolutionFiches(
    'stats_locales_evolution_collectivite_avec_minimum_fiches',
    region,
    department,
  );
  const {data: fiches} = useEvolutionFiches(
    'stats_locales_evolution_nombre_fiches',
    region,
    department,
  );
  const {data: plans} = useEvolutionFiches(
    'stats_evolution_nombre_plans',
    region,
    department,
  );

  const colsNumber =
    (!collectivites ? 0 : 1) + (!fiches ? 0 : 1) + (!plans ? 0 : 1);

  return (
    <>
      {collectivites && fiches && plans && (
        <ChartHead>
          <>
            Évolution de l&apos;utilisation des plans d&apos;action
            <br />
            {collectivites.last} collectivité
            {collectivites.last !== 1 && 's'}
            {collectivites.last === 1 ? ' a ' : ' ont '}
            créé {plans.last} plan{plans.last !== 1 && 's'} d’actions et{' '}
            {fiches.last} fiche
            {fiches.last !== 1 && 's'} actions
          </>
        </ChartHead>
      )}
      <div
        className={classNames('grid grid-cols-1 gap-6', {
          'md:grid-cols-2 xl:grid-cols-3': colsNumber === 3,
          'md:grid-cols-2': colsNumber === 2,
        })}
      >
        {collectivites && (
          <div className="w-full">
            <ChartTitle>Nombre de collectivités avec 5+ fiches</ChartTitle>
            <EvolutionFiches
              vue="stats_locales_evolution_collectivite_avec_minimum_fiches"
              region={region}
              department={department}
            />
          </div>
        )}
        {fiches && (
          <div className="w-full">
            <ChartTitle>Nombre de fiches action créées</ChartTitle>
            <EvolutionFiches
              vue="stats_locales_evolution_nombre_fiches"
              region={region}
              department={department}
            />
          </div>
        )}
        {plans && region === '' && department === '' && (
          <div
            className={classNames('w-full', {
              'md:max-xl:col-span-2 md:max-xl:w-[50%] md:max-xl:mx-auto':
                colsNumber === 3,
            })}
          >
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
