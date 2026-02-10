import { useCallback, useMemo } from 'react';
import { useDraftFinanceursStorage } from './use-draft-financeurs-storage';
import type { DraftFinanceurRowFormValues } from './types';

export const useDraftFinanceurs = (ficheId: number) => {
  const [record, setRecord] = useDraftFinanceursStorage(ficheId);

  const draftFinanceurs = useMemo(() => Object.values(record ?? {}), [record]);

  const hasDraft = useCallback(
    (draftId: string) => draftId in (record ?? {}),
    [record]
  );

  const updateDraftFinanceur = useCallback(
    (financeur: DraftFinanceurRowFormValues) => {
      const previousDraft = record?.[financeur.draftId];
      const mergedDraft = { ...previousDraft, ...financeur };
      const isSameAsPrevious =
        JSON.stringify(previousDraft ?? null) === JSON.stringify(mergedDraft);
      if (isSameAsPrevious) {
        return;
      }
      const newRecord = {
        ...record,
        [financeur.draftId]: mergedDraft,
      };
      setRecord(newRecord);
    },
    [setRecord, record]
  );

  const deleteDraftFinanceur = useCallback(
    (draftId: string) => {
      const newRecord = { ...record };
      delete newRecord[draftId];
      setRecord(newRecord);
    },
    [setRecord, record]
  );

  return {
    draftFinanceurs,
    hasDraft,
    updateDraftFinanceur,
    deleteDraftFinanceur,
  };
};
