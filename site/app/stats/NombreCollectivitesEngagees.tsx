'use client';

import useSWR from 'swr';
import {supabase} from '../initSupabase';
import {ChartHead} from './headings';
import {formatInteger} from './shared';
import {addLocalFilters} from './utils';

// Nombre de collectivités engagées dans le programme (COT ou labellisée 1ère étoile dans un des deux référentiels)
function useCollectivitesEngagees(codeRegion: string, codeDepartement: string) {
  return useSWR(
    `territoires_engages-${codeRegion}-${codeDepartement}`,
    async () => {
      let select = supabase
        .from('stats_locales_engagement_collectivite')
        .select(undefined, {head: true, count: 'estimated'})
        .or('etoiles_eci.gte.1, etoiles_cae.gte.1, cot.eq.true');

      select = addLocalFilters(select, codeDepartement, codeRegion);
      const {count, error} = await select;

      if (error) {
        throw new Error('territoires_engages');
      }
      return count || 0;
    }
  );
}

function useTerritoiresLabellises(codeRegion: string, codeDepartement: string) {
  return useSWR(
    `territoires_labellises-${codeRegion}-${codeDepartement}`,
    async () => {
      let select = supabase
        .from('stats_locales_engagement_collectivite')
        .select(undefined, {head: true, count: 'estimated'})
        .or('etoiles_eci.gte.1, etoiles_cae.gte.1');

      select = addLocalFilters(select, codeDepartement, codeRegion);
      const {count, error} = await select;

      if (error) {
        throw new Error('territoires_labellises');
      }
      return count || 0;
    }
  );
}

function useTerritoiresCOT(codeRegion: string, codeDepartement: string) {
  return useSWR(
    `territoires_cot-${codeRegion}-${codeDepartement}`,
    async () => {
      let select = supabase
        .from('stats_locales_engagement_collectivite')
        .select(undefined, {head: true, count: 'estimated'})
        .eq('cot', true);

      select = addLocalFilters(select, codeDepartement, codeRegion);
      const {count, error} = await select;

      if (error) {
        throw new Error('territoires_cot');
      }
      return count || 0;
    }
  );
}

type NombreCollectivitesEngageesProps = {
  region?: string;
  department?: string;
};

export default function NombreCollectivitesEngagees({
  region = '',
  department = '',
}: NombreCollectivitesEngageesProps) {
  const {data: cot} = useTerritoiresCOT(region, department);
  const {data: labellises} = useTerritoiresLabellises(region, department);
  const {data: engages} = useCollectivitesEngagees(region, department);

  return (
    <ChartHead>
      {formatInteger(engages || 0)} Territoires Engagés Transition Écologique,
      dont {formatInteger(labellises || 0)} collectivités labellisées et{' '}
      {formatInteger(cot || 0)} en Contrat d’Objectif Territorial (COT)
    </ChartHead>
  );
}
