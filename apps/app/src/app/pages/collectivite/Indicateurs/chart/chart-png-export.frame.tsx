import type { PropsWithChildren, ReactPortal, RefObject } from 'react';
import { createPortal } from 'react-dom';

type Props = PropsWithChildren<{
  containerRef: RefObject<HTMLDivElement | null>;
}>;

export const ChartPngExportFrame = ({
  containerRef,
  children,
}: Props): ReactPortal =>
  createPortal(
    <div
      ref={containerRef}
      aria-hidden
      className="fixed top-0 -left-[10000px] w-[1000px] p-6 bg-white"
    >
      {children}
    </div>,
    document.body
  );
