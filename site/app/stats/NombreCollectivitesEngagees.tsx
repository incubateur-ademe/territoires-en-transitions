'use client';

import useSWR from 'swr';
import {supabase} from '../initSupabase';
import {ChartHead} from './headings';
import {formatInteger} from './shared';

// Nombre de collectivités engagées dans le programme (COT ou labellisée 1ère étoile dans un des deux référentiels)
function useCollectivitesEngagees() {
  return useSWR('territoires_engages', async () => {
    const {count, error} = await supabase
      .from('stats_engagement_collectivite')
      .select(undefined, {head: true, count: 'estimated'})
      .or('etoiles_eci.gte.1, etoiles_cae.gte.1, cot.eq.true');
    if (error) {
      throw new Error('territoires_engages');
    }
    return count || 0;
  });
}

function useTerritoiresLabellises() {
  return useSWR('territoires_labellises', async () => {
    const {count, error} = await supabase
      .from('stats_engagement_collectivite')
      .select(undefined, {head: true, count: 'estimated'})
      .or('etoiles_eci.gte.1, etoiles_cae.gte.1');
    if (error) {
      throw new Error('territoires_labellises');
    }
    return count || 0;
  });
}

function useTerritoiresCOT() {
  return useSWR('territoires_cot', async () => {
    const {count, error} = await supabase
      .from('stats_engagement_collectivite')
      .select(undefined, {head: true, count: 'estimated'})
      .eq('cot', true);
    if (error) {
      throw new Error('territoires_cot');
    }
    return count || 0;
  });
}

export default function NombreCollectivitesEngagees() {
  const {data: cot} = useTerritoiresCOT();
  const {data: labellises} = useTerritoiresLabellises();
  const {data: engages} = useCollectivitesEngagees();

  return (
    <ChartHead>
      {formatInteger(engages || 0)} Territoires Engagés Transition Écologique,
      dont {formatInteger(labellises || 0)} collectivités labellisées et{' '}
      {formatInteger(cot || 0)} en Contrat d’Objectif Territorial (COT)
    </ChartHead>
  );
}
