'use client';

import { createContext, useContext } from 'react';

type PageHeaderContextValue = {
  titleId: string | undefined;
  compact: boolean;
};

export const PageHeaderContext = createContext<PageHeaderContextValue>({
  titleId: undefined,
  compact: false,
});

export const usePageHeaderContext = (): PageHeaderContextValue =>
  useContext(PageHeaderContext);
