import React, {ReactNode} from 'react';
import IndicateursRenseignes from './IndicateursRenseignes';
import ValeursIndicateursRenseignees from './ValeursIndicateursRenseignees';
import ValeursIndicateursPersoRenseignees from './ValeursIndicateursPersoRenseignees';
import {ChartHead} from './headings';
import useSWR from 'swr';
import {supabase} from '../initSupabase';
import {addLocalFilters} from './utils';

const useCollectivitesAvecIndicateur = (
  codeRegion: string,
  codeDepartement: string,
) => {
  const date = new Date();
  const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-01`;

  return useSWR(
    `stats_locales_evolution_collectivite_avec_indicateur-${codeRegion}-${codeDepartement}`,
    async () => {
      let select = supabase
        .from('stats_locales_evolution_collectivite_avec_indicateur')
        .select()
        .gte('mois', formattedDate);

      select = addLocalFilters(select, codeDepartement, codeRegion);

      const {data, error} = await select;

      if (error) {
        throw new Error('stats_locales_evolution_collectivite_avec_indicateur');
      }
      if (!data || !data.length) return null;

      return data[0].collectivites;
    },
  );
};

type EvolutionIndicateursProps = {
  region?: string;
  department?: string;
};

export function EvolutionIndicateurs({
  region = '',
  department = '',
}: EvolutionIndicateursProps) {
  const {data} = useCollectivitesAvecIndicateur(region, department);

  return (
    <>
      <ChartHead>
        Évolution de l’utilisation des indicateurs - {data} collectivité
        {data !== 1 && 's'}
        {data === 1 ? ' a' : ' ont'} renseigné des indicateurs
      </ChartHead>
      <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
        <Column>
          <IndicateursRenseignes region={region} department={department} />
        </Column>
        <Column>
          <ValeursIndicateursRenseignees
            region={region}
            department={department}
          />
        </Column>
        <Column>
          <ValeursIndicateursPersoRenseignees
            region={region}
            department={department}
          />
        </Column>
      </div>
    </>
  );
}

const Column = ({children}: {children: ReactNode[] | ReactNode}) => (
  <div className="fr-col-xs-12 fr-col-sm-12 fr-col-md-4 fr-col-lg-4">
    {children}
  </div>
);
