import { Indicateurs } from '@/api';
import { DISABLE_AUTO_REFETCH } from '@/api/utils/react-query/query-options';
import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { useQuery } from 'react-query';

/** Charge la définition détaillée d'un indicateur */
export const useIndicateurDefinition = (indicateurId: number | string) => {
  const collectiviteId = useCollectiviteId();

  const { data } = useQuery(
    ['indicateur_definition', collectiviteId, indicateurId],
    async () => {
      if (!collectiviteId) return;
      if (typeof indicateurId === 'number') {
        return Indicateurs.fetch.selectIndicateurDefinition(
          supabaseClient,
          indicateurId,
          collectiviteId
        );
      }
      return Indicateurs.fetch.selectIndicateurReferentielDefinition(
        supabaseClient,
        indicateurId,
        collectiviteId
      );
    },
    DISABLE_AUTO_REFETCH
  );
  return data;
};

/** Charge la définition détaillée de plusieurs indicateurs */
export const useIndicateurDefinitions = (
  parentId: number,
  indicateurIds: number[]
) => {
  const collectiviteId = useCollectiviteId();

  const { data, isLoading } = useQuery(
    ['indicateur_definitions', collectiviteId, parentId, indicateurIds],
    async () => {
      if (!collectiviteId) return;
      return Indicateurs.fetch.selectIndicateurDefinitions(
        supabaseClient,
        indicateurIds,
        collectiviteId
      );
    },
    DISABLE_AUTO_REFETCH
  );
  return { data, isLoading };
};

/** Charge la définition détaillée de plusieurs indicateurs référentiels */
export const useIndicateurReferentielDefinitions = (
  identifiantsReferentiel: string[]
) => {
  const collectiviteId = useCollectiviteId();

  const { data } = useQuery(
    ['indicateur_definitions', collectiviteId, identifiantsReferentiel],
    async () => {
      if (!collectiviteId || !identifiantsReferentiel?.length) return;
      return Indicateurs.fetch.selectIndicateurReferentielDefinitions(
        supabaseClient,
        identifiantsReferentiel,
        collectiviteId
      );
    },
    DISABLE_AUTO_REFETCH
  );
  return data;
};
