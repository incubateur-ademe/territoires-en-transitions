import {useQuery} from 'react-query';
import {Indicateurs} from '@tet/api';
import {DISABLE_AUTO_REFETCH, supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {SOURCE_COLLECTIVITE} from './constants';
import {useIndicateurImportSources} from './Indicateur/detail/useImportSources';
import {useIndicateurDefinition} from './Indicateur/useIndicateurDefinition';

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

/** Charge toutes les valeurs associées à un indicateur (pour le graphe) */
export const useIndicateurReferentielValeurs = ({
  identifiant,
  autoRefresh = false,
}: {
  /** Identifiant indicateur prédéfini */
  identifiant: string;
  /**
   * Indique si le rafraichissement des datas du graphique doit se faire automatiquement.
   * `false` par défaut.
   */
  autoRefresh?: boolean;
}) => {
  const collectivite_id = useCollectiviteId();
  const source = SOURCE_COLLECTIVITE;
  const indicateur = useIndicateurDefinition(identifiant);
  const indicateurId = indicateur?.id;

  return useQuery(
    ['indicateur_valeurs', collectivite_id, indicateurId, source],
    async () => {
      if (!collectivite_id || indicateurId === undefined) return;
      return Indicateurs.fetch.selectIndicateurValeurs(
        supabaseClient,
        indicateurId,
        collectivite_id,
        null
      );
    },
    autoRefresh ? undefined : DISABLE_AUTO_REFETCH
  );
};
