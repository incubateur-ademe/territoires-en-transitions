import useLocalStorage from 'react-use/lib/useLocalStorage';
import type { DraftFinanceurRowFormValues } from './types';
import { draftFinanceurRowFormSchema } from './types';

const STORAGE_KEY_PREFIX = 'tet_financeurs_draft';

export type DraftFinanceursRecord = Record<string, DraftFinanceurRowFormValues>;

export const getStorageKey = (ficheId: number): string => {
  return `${STORAGE_KEY_PREFIX}_${ficheId}`;
};

function deserializeDraftFinanceurs(stored: string): DraftFinanceursRecord {
  try {
    const parsed = JSON.parse(stored);
    if (
      parsed === null ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      return {};
    }
    const record: DraftFinanceursRecord = {};
    for (const [key, item] of Object.entries(parsed)) {
      const result = draftFinanceurRowFormSchema.safeParse(item);
      if (result.success && result.data.draftId === key) {
        record[key] = result.data;
      }
    }
    return record;
  } catch {
    return {};
  }
}

export const useDraftFinanceursStorage = (ficheId: number) => {
  const key = getStorageKey(ficheId);
  const [record, setRecord] = useLocalStorage<DraftFinanceursRecord>(key, {}, {
    raw: false,
    serializer: (value) => JSON.stringify(value),
    deserializer: deserializeDraftFinanceurs,
  });

  return [record ?? {}, setRecord] as const;
};
