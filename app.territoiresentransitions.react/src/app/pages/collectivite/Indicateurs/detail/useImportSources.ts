import {useEffect, useState} from 'react';
import {useQuery} from 'react-query';
import {Indicateurs} from '@tet/api';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {SOURCE_COLLECTIVITE} from '../constants';
import {SourceType} from '../types';

export type IndicateurImportSource = {
  id: string;
  libelle: string;
  type: SourceType | null;
};

/**
 * Fourni la liste des sources de données d'un indicateur ainsi que la source
 * courante et une fonction pour changer la source courante.
 */
export const useIndicateurImportSources = (indicateur_id: number) => {
  const collectivite_id = useCollectiviteId();
  // charge la liste des sources disponibles
  const {data: sources, isLoading: isLoading1} = useImportSources(
    collectivite_id,
    indicateur_id
  );

  // détermine si il y a des valeurs saisies manuellement
  const {data: hasCustomValues, isLoading: isLoading2} = useHasCustomValues(
    collectivite_id,
    indicateur_id
  );

  // la source par défaut est les valeurs de la collectivité sauf si il n'y en a
  // pas mais qu'il y a des valeurs importées
  const defaultSource =
    !hasCustomValues && sources?.length ? sources[0]?.id : SOURCE_COLLECTIVITE;

  // source sélectionnée
  const [currentSource, setCurrentSource] = useState(defaultSource);

  // synchronise la source sélectionnée avec la source par défaut
  useEffect(() => {
    setCurrentSource(defaultSource);
  }, [defaultSource]);

  return {
    isLoading: isLoading1 || isLoading2,
    sources,
    defaultSource,
    currentSource,
    setCurrentSource,
  };
};

/**
 * Charge la liste des différentes sources de données d'un indicateur
 */
const useImportSources = (
  collectiviteId: number | null,
  indicateurId: number
) => {
  return useQuery(
    ['indicateur_import_sources', collectiviteId, indicateurId],
    async () => {
      if (!collectiviteId) return;

      return Indicateurs.fetch.selectIndicateurSources(
        supabaseClient,
        indicateurId,
        collectiviteId
      );
    }
  );
};

/**
 * Détermine si un indicateur prédéini a des valeurs saisies manuellement.
 */
const useHasCustomValues = (
  collectivite_id: number | null,
  indicateur_id: number | undefined
) => {
  return useQuery(
    ['indicateur_has_custom_values', collectivite_id, indicateur_id],
    async () => {
      if (
        !collectivite_id ||
        indicateur_id === undefined ||
        typeof indicateur_id !== 'string'
      )
        return;
      const {count} = await supabaseClient
        .from('indicateur_valeur')
        .select('', {count: 'exact', head: true})
        .match({collectivite_id, indicateur_id, type: 'resultat'})
        .not('valeur', 'is', null);

      return count !== null && count > 0;
    }
  );
};
