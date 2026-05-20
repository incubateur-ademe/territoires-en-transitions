'use client';

import { IndicatorValues } from './grid-model';
import { demoIndicators } from './indicator-values-source';

const STORAGE_KEY_PREFIX = 'tet-demarche-pcaet-polluants';

const storageKey = (collectiviteId: number): string =>
  `${STORAGE_KEY_PREFIX}:${collectiviteId}`;

const readStored = (collectiviteId: number): IndicatorValues[] | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(storageKey(collectiviteId));
    return raw ? (JSON.parse(raw) as IndicatorValues[]) : null;
  } catch {
    return null;
  }
};

export const getPolluantsIndicators = ({
  collectiviteId,
  referenceYear,
}: {
  collectiviteId: number;
  referenceYear: number;
}): IndicatorValues[] =>
  readStored(collectiviteId) ?? demoIndicators({ referenceYear });

export const savePolluantsIndicators = ({
  collectiviteId,
  indicators,
}: {
  collectiviteId: number;
  indicators: IndicatorValues[];
}): void => {
  if (typeof window === 'undefined') {
    return;
  }
  window.sessionStorage.setItem(
    storageKey(collectiviteId),
    JSON.stringify(indicators)
  );
};
