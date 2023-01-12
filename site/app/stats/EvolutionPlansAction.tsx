import React from 'react';
import { ChartHead, ChartTitle } from './headings';
import EvolutionFiches, { useEvolutionFiches } from './EvolutionFiches';

export function EvolutionPlansAction() {
  const { data: collectivites } = useEvolutionFiches(
    'stats_evolution_collectivite_avec_minimum_fiches'
  );
  const { data: fiches } = useEvolutionFiches('stats_evolution_nombre_fiches');
  if (!collectivites || !fiches) {
    return null;
  }

  return (
    <>
      <ChartHead>
        <>
          Évolution de l&apos;utilisation des plans d&apos;action
          <br />
          {collectivites.last} collectivités ont créé des plans d’actions et{' '}
          {fiches.last} fiches actions ont été créées
        </>
      </ChartHead>
      <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
        <div className="fr-col-xs-12 fr-col-sm-12 fr-col-md-6 fr-col-lg-6 fr-ratio-16x9">
          <ChartTitle>Nombre de collectivités avec 5+ fiches</ChartTitle>
          <EvolutionFiches vue="stats_evolution_collectivite_avec_minimum_fiches" />
        </div>
        <div className="fr-col-xs-12 fr-col-sm-12 fr-col-md-6 fr-col-lg-6 fr-ratio-16x9">
          <ChartTitle>Nombre de fiches action créées</ChartTitle>
          <EvolutionFiches vue="stats_evolution_nombre_fiches" />
        </div>
      </div>
    </>
  );
}
