import {useQuery} from 'react-query';
import {DISABLE_AUTO_REFETCH, supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {Enums} from '@tet/api';
import {SourceType, TIndicateurDefinition} from './types';
import {SOURCE_COLLECTIVITE} from './constants';
import {useIndicateurImportSources} from './detail/useImportSources';

export type TIndicateurValeur = {
  annee: number;
  type: Enums<'indicateur_valeur_type'>;
  valeur: number;
};

export type TIndicateurValeurEtCommentaires = TIndicateurValeur & {
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
  id: number | string | undefined;
  /** Source des données à utiliser */
  importSource?: string;
  /**
   * Indique si le rafraichissement des datas du graphique doit se faire automatiquement.
   * `false` par défaut.
   */
  autoRefresh?: boolean;
}) => {
  const collectivite_id = useCollectiviteId();
  const isPerso = typeof id === 'number';
  const {defaultSource} = useIndicateurImportSources(id);
  const source = importSource || defaultSource;

  return useQuery(
    ['indicateur_valeurs', collectivite_id, id, source],
    async () => {
      if (collectivite_id === undefined || id === undefined) return;
      const query = supabaseClient
        .from('indicateurs')
        .select('type,annee,valeur')
        .match(
          isPerso
            ? {collectivite_id, indicateur_perso_id: id}
            : {collectivite_id, indicateur_id: id}
        )
        .not('valeur', 'is', null);

      if (source && source !== SOURCE_COLLECTIVITE) {
        query.eq('source_id', source);
      } else {
        query.is('source_id', null);
      }

      const {data} = await query
        .order('annee', {ascending: false})
        .returns<TIndicateurValeur[]>();
      return data;
    },
    autoRefresh ? undefined : DISABLE_AUTO_REFETCH
  );
};

/** Charge les valeurs et les commentaires associées à un indicateur (pour les tableaux) */
export const useIndicateurValeursEtCommentaires = ({
  definition,
  type,
  importSource,
}: {
  definition: TIndicateurDefinition;
  type: SourceType;
  importSource?: string;
}) => {
  const {id, isPerso} = definition;
  const collectivite_id = useCollectiviteId();

  return useQuery(
    ['indicateur_valeurs_detail', collectivite_id, id, type, importSource],
    async () => {
      if (collectivite_id === undefined || id === undefined) return;

      const query = supabaseClient
        .from('indicateurs')
        .select('type,annee,valeur,commentaire,source')
        .match(
          isPerso
            ? {collectivite_id, indicateur_perso_id: id}
            : {collectivite_id, indicateur_id: id}
        )
        .not('valeur', 'is', null)
        .order('annee', {ascending: false});

      if (type === 'objectif') {
        query.is('source_id', null);
        query.eq('type', type);
      } else {
        if (importSource && importSource !== SOURCE_COLLECTIVITE) {
          query.eq('source_id', importSource);
          query.eq('type', 'import');
        } else {
          query.is('source_id', null);
          query.eq('type', 'resultat');
        }
      }

      const {data} = await query.returns<TIndicateurValeurEtCommentaires[]>();
      return data;
    }
  );
};
