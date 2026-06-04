import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

type Props = {
  render: ({ isSticky }: { isSticky: boolean }) => React.ReactNode;
};

export const Z_INDEX_ABOVE_STICKY_HEADER = 50;

const StickyHeaderHeightContext = createContext<{
  height: number;
  setContentRef: (node: HTMLDivElement | null) => void;
}>({ height: 0, setContentRef: () => {} });

export function useStickyHeaderHeight(): number {
  return useContext(StickyHeaderHeightContext).height;
}

export function StickyHeaderHeightProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
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

const HeaderSticky = ({ render }: Props) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const { setContentRef } = useContext(StickyHeaderHeightContext);

  const [isSticky, setIsSticky] = useState(false);
  const [originalHeight, setOriginalHeight] = useState<number | undefined>();

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (sentinel === null) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const header = headerRef.current;
    if (header === null) return;
    const observer = new ResizeObserver(() => {
      setOriginalHeight(header.offsetHeight);
    });
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="h-px -mb-px" />
      <div
        ref={headerRef}
        style={{ minHeight: isSticky ? `${originalHeight}px` : undefined }}
        className="sticky top-0 z-sticky-header pointer-events-none"
      >
        <div ref={setContentRef} className="pointer-events-auto">
          {render({ isSticky })}
        </div>
      </div>
    </>
  );
};

export default HeaderSticky;
