'use client';

import { parseAsInteger, useQueryState } from 'nuqs';

export const useRegleOuverte = () =>
  useQueryState('regle', parseAsInteger.withOptions({ history: 'replace' }));
