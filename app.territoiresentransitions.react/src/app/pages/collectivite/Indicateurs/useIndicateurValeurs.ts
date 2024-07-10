import {useQuery} from 'react-query';
import {Indicateurs} from '@tet/api';
import {DISABLE_AUTO_REFETCH, supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {SOURCE_COLLECTIVITE} from './constants';
import {useIndicateurImportSources} from './detail/useImportSources';

// export type TIndicateurValeur = Indicateurs.domain.Valeur;
export type TIndicateurValeur = {
  id?: number | null;
  annee: number;
  type: 'objectif' | 'resultat' | 'import';
  valeur: number;
  source: string | null;
  commentaire: string | null;
};

/** Charge toutes les valeurs associées à un indicateur (pour le graphe) */
export const useIndicateurValeurs = ({
  id,
  importSource,
  autoRefresh = false,
}: {
  /** Identifiant indicateur perso ou prédéfini */
  id: number;
  /** Source des données à utiliser */
  importSource?: string;
  /**
   * Indique si le rafraichissement des datas du graphique doit se faire automatiquement.
   * `false` par défaut.
   */
  autoRefresh?: boolean;
}) => {
  const collectivite_id = useCollectiviteId();
  const {defaultSource} = useIndicateurImportSources(id);
  const source = importSource || defaultSource;

  return useQuery(
    ['indicateur_valeurs', collectivite_id, id, source],
    async () => {
      if (!collectivite_id || id === undefined) return;
      return Indicateurs.fetch.selectIndicateurValeurs(
        supabaseClient,
        id,
        collectivite_id,
        source === SOURCE_COLLECTIVITE ? null : source
      );
    },
    autoRefresh ? undefined : DISABLE_AUTO_REFETCH
  );
};
