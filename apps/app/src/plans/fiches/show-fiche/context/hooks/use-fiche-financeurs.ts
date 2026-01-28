import { Financeur, FicheWithRelations } from '@tet/domain/plans';
import { useCallback, useMemo } from 'react';
import { useUpdateFiche } from '../../../update-fiche/data/use-update-fiche';
import { FinanceursState } from '../types';

export const useFicheFinanceurs = (
  fiche: FicheWithRelations
): FinanceursState => {
  const { mutate: updateFiche } = useUpdateFiche();

  const financeurs = useMemo(() => fiche.financeurs ?? [], [fiche.financeurs]);

  const upsertFinanceur = useCallback(
    async (data: {
      financeurTagId: number;
      montantTtc: number;
      financeurTag: { id: number; nom: string; collectiviteId: number };
    }) => {
      const updatedFinanceur: Financeur = {
        ficheId: fiche.id,
        financeurTagId: data.financeurTagId,
        montantTtc: data.montantTtc,
        financeurTag: data.financeurTag,
      };

      const isExisting = financeurs.some(
        (f) => f.financeurTagId === data.financeurTagId
      );

      const updatedFinanceurs = isExisting
        ? financeurs.map((f) =>
            f.financeurTagId === data.financeurTagId ? updatedFinanceur : f
          )
        : [...financeurs, updatedFinanceur];

      updateFiche({
        ficheId: fiche.id,
        ficheFields: { financeurs: updatedFinanceurs },
      });
    },
    [fiche.id, financeurs, updateFiche]
  );

  const deleteFinanceur = useCallback(
    async (financeurTagId: number) => {
      const updatedFinanceurs = financeurs.filter(
        (f) => f.financeurTagId !== financeurTagId
      );

      updateFiche({
        ficheId: fiche.id,
        ficheFields: { financeurs: updatedFinanceurs },
      });
    },
    [fiche.id, financeurs, updateFiche]
  );

  return useMemo(
    () => ({
      list: financeurs,
      upsert: upsertFinanceur,
      delete: deleteFinanceur,
    }),
    [financeurs, upsertFinanceur, deleteFinanceur]
  );
};
