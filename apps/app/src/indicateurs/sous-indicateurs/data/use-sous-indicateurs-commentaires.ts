import { useCollectiviteId } from '@tet/api/collectivites';
import {
  COLLECTIVITE_SOURCE_ID,
  IndicateurPeriodes,
  type IndicateurPeriode,
} from '@tet/domain/indicateurs';
import { useCallback, useMemo } from 'react';
import { useListIndicateurValeurs } from '../../valeurs/use-list-indicateur-valeurs';
import { useUpsertIndicateurValeur } from '../../valeurs/use-upsert-indicateur-valeur';
import {
  NO_COMMENTAIRES,
  toCommentairesByPeriodeKey,
  type PeriodeCommentaires,
} from '../sous-indicateurs-commentaires.rules';

export type SousIndicateursCommentaires = Readonly<{
  commentairesOf: (periode: IndicateurPeriode) => PeriodeCommentaires;
  save: (
    input: Readonly<{
      periode: IndicateurPeriode;
      commentaires: PeriodeCommentaires;
    }>
  ) => Promise<boolean>;
}>;

export const useSousIndicateursCommentaires = (
  indicateurId: number
): SousIndicateursCommentaires => {
  const collectiviteId = useCollectiviteId();
  const { data } = useListIndicateurValeurs({
    indicateurIds: [indicateurId],
    sources: [COLLECTIVITE_SOURCE_ID],
  });
  const { mutateAsync: upsertValeur } = useUpsertIndicateurValeur({
    disableCreateToast: true,
  });
  const commentairesByPeriodeKey = useMemo(
    () =>
      toCommentairesByPeriodeKey(
        data?.indicateurs.flatMap(
          ({ sources }) => sources[COLLECTIVITE_SOURCE_ID]?.valeurs ?? []
        ) ?? []
      ),
    [data]
  );

  const commentairesOf = useCallback(
    (periode: IndicateurPeriode): PeriodeCommentaires =>
      commentairesByPeriodeKey.get(IndicateurPeriodes.key(periode)) ??
      NO_COMMENTAIRES,
    [commentairesByPeriodeKey]
  );

  const save = useCallback(
    async ({
      periode,
      commentaires,
    }: Parameters<
      SousIndicateursCommentaires['save']
    >[0]): Promise<boolean> => {
      try {
        await upsertValeur({
          collectiviteId,
          indicateurId,
          dateValeur: periode.dateDebut,
          periodicite: periode.periodicite,
          resultatCommentaire: commentaires.resultat,
          objectifCommentaire: commentaires.objectif,
        });
        return true;
      } catch {
        return false;
      }
    },
    [collectiviteId, indicateurId, upsertValeur]
  );

  return useMemo(() => ({ commentairesOf, save }), [commentairesOf, save]);
};
