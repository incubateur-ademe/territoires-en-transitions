'use client';

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

type StickyHeaderHeightContextValue = {
  height: number;
  setContentRef: (node: HTMLDivElement | null) => void;
};

const StickyHeaderHeightContext =
  createContext<StickyHeaderHeightContextValue | null>(null);

function useStickyHeaderHeightContext(): StickyHeaderHeightContextValue {
  const context = useContext(StickyHeaderHeightContext);
  if (context === null) {
    throw new Error(
      'useStickyHeaderHeight must be used within a PageHeaderStickyHeightProvider'
    );
  }
  return context;
}

export function useStickyHeaderHeight(): number {
  return useStickyHeaderHeightContext().height;
}

export function useStickyHeaderHeightSetter(): StickyHeaderHeightContextValue['setContentRef'] {
  return useStickyHeaderHeightContext().setContentRef;
}

export function PageHeaderStickyHeightProvider({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  const [contentRef, setContentRef] = useState<HTMLDivElement | null>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!contentRef) return;
    const observer = new ResizeObserver(([entry]) => {
      setHeight(entry.contentRect.height);
    });
    observer.observe(contentRef);
    return () => observer.disconnect();
  }, [contentRef]);

  return (
    <StickyHeaderHeightContext.Provider value={{ height, setContentRef }}>
      {children}
    </StickyHeaderHeightContext.Provider>
  );
}
PageHeaderStickyHeightProvider.displayName = 'PageHeaderStickyHeightProvider';
