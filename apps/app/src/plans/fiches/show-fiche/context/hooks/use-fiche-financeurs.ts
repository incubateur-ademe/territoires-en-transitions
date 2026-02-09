import { useFinanceursListe } from '@/app/ui/dropdownLists/FinanceursDropdown/useFinanceursListe';
import { FicheWithRelations, Financeur } from '@tet/domain/plans';
import { useCallback, useMemo } from 'react';
import { useUpdateFiche } from '../../../update-fiche/data/use-update-fiche';
import { getFicheAllEditorCollectiviteIds } from '../../share-fiche/share-fiche.utils';
import { FinanceursState } from '../types';

export const useFicheFinanceurs = (
  fiche: FicheWithRelations
): FinanceursState => {
  const { mutate: updateFiche } = useUpdateFiche();

  const financeurs = useMemo(() => fiche.financeurs ?? [], [fiche.financeurs]);
  const financeursList = useFinanceursListe(
    getFicheAllEditorCollectiviteIds(fiche)
  );
  const upsertFinanceur = useCallback(
    async (data: { financeurTagId: number; montantTtc: number }) => {
      const financeurTag = financeursList.data?.find(
        (f) => f.id === data.financeurTagId
      );

      if (!financeurTag) {
        throw new Error('Financeur tag not found');
      }

      const updatedFinanceur: Financeur = {
        ficheId: fiche.id,
        financeurTagId: data.financeurTagId,
        montantTtc: data.montantTtc,
        financeurTag,
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
    [fiche.id, financeurs, financeursList.data, updateFiche]
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

  const getFinanceurName = useCallback(
    (financeurTagId: number) => {
      return financeursList.data?.find((f) => f.id === financeurTagId)?.nom;
    },
    [financeursList.data]
  );
  return useMemo(
    () => ({
      list: financeurs,
      upsert: upsertFinanceur,
      delete: deleteFinanceur,
      getFinanceurName,
    }),
    [financeurs, upsertFinanceur, deleteFinanceur, getFinanceurName]
  );
};
