import {useQuery} from 'react-query';
import {DISABLE_AUTO_REFETCH, supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {Database} from 'types/database.types';
import {TIndicateurDefinition} from './types';

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
export const useIndicateurValeurs = (
  {id, isPerso}: TIndicateurDefinition,
  /** passer `true` pour le cas où le graphe est sur la page détail car
   * les valeurs peuvent être éditées dans un autre onglet et un autre
   * indicateur (cas indicateur lié à un autre) */
  autoRefetch?: boolean
) => {
  const collectivite_id = useCollectiviteId();
  return useQuery(
    ['indicateur_valeurs', collectivite_id, id],
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
        .not('valeur', 'is', null)
        .order('annee', {ascending: false})
        .returns<TIndicateurValeur>();

      const {data} = await query;
      return filtreImportOuResultat(data);
    },
    autoRefetch ? undefined : DISABLE_AUTO_REFETCH
  );
};

/** Charge les valeurs et les commentaires associées à un indicateur (pour les tableaux) */
export const useIndicateurValeursEtCommentaires = ({
  definition,
  type,
}: {
  definition: TIndicateurDefinition;
  type: 'resultat' | 'objectif';
}) => {
  const {id, isPerso} = definition;
  const collectivite_id = useCollectiviteId();

  return useQuery(
    ['indicateur_valeurs_detail', collectivite_id, id, type],
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
        query.eq('type', type);
      } else {
        query.in('type', ['resultat', 'import']);
      }

      const {data} = await query.returns<TIndicateurValeurEtCommentaires>();
      return filtreImportOuResultat(data);
    }
  );
};

// filtre une liste de valeurs pour ne conserver que la valeur "resultat" quand
// il y a aussi une valeur "import" pour la même date
const filtreImportOuResultat = <
  T extends Pick<TIndicateurValeur, 'annee' | 'type'>
>(
  valeurs: T[] | null
) => {
  return valeurs?.filter(
    v =>
      v.type !== 'import' ||
      valeurs.findIndex(
        vv => vv.annee === v.annee && vv.type === 'resultat'
      ) === -1
  );
};
