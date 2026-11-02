'use client';

import { parseAsStringLiteral, useQueryState } from 'nuqs';

export const ASSISTANT_TAB_PARAM = 'onglet';
export const assistantTabs = ['presentation', 'claude', 'crisp'] as const;
export type AssistantTab = (typeof assistantTabs)[number];

/** Onglet de la page Assistant, dans l'URL pour qu'un lien mène au bon. */
export const useAssistantTabQueryState = () =>
  useQueryState(
    ASSISTANT_TAB_PARAM,
    parseAsStringLiteral(assistantTabs)
      .withDefault('presentation')
      .withOptions({ history: 'push' })
  );
