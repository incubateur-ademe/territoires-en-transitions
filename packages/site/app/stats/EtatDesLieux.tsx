import React from 'react';
import {ChartHead, ChartTitle} from './headings';
import TrancheCompletude, {useTrancheCompletude} from './TrancheCompletude';

type EtatDesLieuxProps = {
  region?: string;
  department?: string;
};

export function EtatDesLieux({
  region = '',
  department = '',
}: EtatDesLieuxProps) {
  const {data} = useTrancheCompletude(region, department);
  if (!data) return null;

  const {inities, termines, presqueTermines} = data;

  return (
    <>
      <ChartHead>
        États des lieux réalisés, ventilés par taux de progression
        <br />
        {inities} état{inities !== 1 && 's'} des lieux initié
        {inities !== 1 && 's'}, dont {presqueTermines} réalisé
        {presqueTermines !== 1 && 's'} à plus de 80% et {termines} terminé
        {termines !== 1 && 's'} (100%)
      </ChartHead>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="w-full">
          <ChartTitle>Climat Air Énergie</ChartTitle>
          <TrancheCompletude
            referentiel="cae"
            region={region}
            department={department}
          />
        </div>
        <div className="w-full">
          <ChartTitle>Économie circulaire</ChartTitle>
          <TrancheCompletude
            referentiel="eci"
            region={region}
            department={department}
          />
        </div>
      </div>
    </>
  );
}
