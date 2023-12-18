import {useQuery} from 'react-query';
import {DISABLE_AUTO_REFETCH, supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {Database} from 'types/database.types';
import {TIndicateurDefinition} from './types';
import {
  SOURCE_COLLECTIVITE,
  useIndicateurImportSources,
} from './detail/useImportSources';

export type TIndicateurValeur = {
  annee: number;
  type: Database['public']['Enums']['indicateur_valeur_type'];
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
  isDetail,
}: {
  /** Identifiant indicateur perso ou prédéfini */
  id: number | string;
  /** Source des données à utiliser */
  importSource?: string;
  /** Indique si le graphique est en mode "détail" (ou en vignette) */
  isDetail: boolean;
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
        query.eq('source', source);
      } else {
        query.is('source', null);
      }

      const {data} = await query
        .order('annee', {ascending: false})
        .returns<TIndicateurValeur[]>();
      return data;
    },
    /** il faut recharger plus souvent quand le graphe est sur la page détail car
     * les valeurs peuvent être éditées dans un autre onglet et un autre
     * indicateur (cas indicateur lié à un autre) */
    isDetail ? undefined : DISABLE_AUTO_REFETCH
  );
};

/** Charge les valeurs et les commentaires associées à un indicateur (pour les tableaux) */
export const useIndicateurValeursEtCommentaires = ({
  definition,
  type,
  importSource,
}: {
  definition: TIndicateurDefinition;
  type: 'resultat' | 'objectif';
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
        query.is('source', null);
        query.eq('type', type);
      } else {
        if (importSource && importSource !== SOURCE_COLLECTIVITE) {
          query.eq('source', importSource);
          query.eq('type', 'import');
        } else {
          query.is('source', null);
          query.eq('type', 'resultat');
        }
      }

      const {data} = await query.returns<TIndicateurValeurEtCommentaires[]>();
      return data;
    }
  );
};
