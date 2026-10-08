'use client';

import { appLabels } from '@/app/labels/catalog';
import { cn, Table } from '@tet/ui';
import { ComponentProps, CSSProperties, ReactNode, useRef } from 'react';
import { GridMaxHeight } from './types';
import { useHorizontalScrollEdges } from './use-horizontal-scroll-edges';
import { useTableHeadHeight } from './use-table-head-height';

type Props = {
  children: ReactNode;
  maxHeight?: GridMaxHeight;
  /** Combined annual values need content-sized columns; PCAET uses fixed widths. */
  layout?: 'fixed' | 'auto';
  'aria-label'?: string;
  'data-test'?: string;
  role?: ComponentProps<typeof Table>['role'];
};

const MAX_HEIGHT_CLASSNAME: Record<GridMaxHeight, string | undefined> = {
  compact: 'max-h-[70vh]',
  // Leave room for the PCAET page's sticky step bar.
  viewport: 'max-h-[calc(100dvh-6rem)]',
  none: undefined,
};

/** Shared scrolling surface; the PCAET height and sticky-header behavior are the defaults. */
export const IndicateurValeursTableFrame = ({
  children,
  maxHeight = 'compact',
  layout = 'fixed',
  'aria-label': ariaLabel = appLabels.indicateurValeursGrille,
  'data-test': dataTest,
  role = 'grid',
}: Props) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const headHeight = useTableHeadHeight(tableRef);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { canScrollLeft, canScrollRight } = useHorizontalScrollEdges(scrollRef);

  return (
    <div
      ref={scrollRef}
      data-test={dataTest}
      data-can-scroll-left={canScrollLeft}
      data-can-scroll-right={canScrollRight}
      // The height cap creates the vertical scroll area. Isolation keeps sticky
      // headers below page chrome; scroll edges drive the pinned-column shadows.
      className={cn(
        'group isolate overflow-auto rounded-xl border border-grey-3',
        MAX_HEIGHT_CLASSNAME[maxHeight]
      )}
      style={{ '--grid-head-height': `${headHeight}px` } as CSSProperties}
    >
      <Table
        ref={tableRef}
        aria-label={ariaLabel}
        role={role}
        className={cn(
          'border-separate border-spacing-0',
          layout === 'auto' ? 'table-auto' : 'table-fixed'
        )}
      >
        {children}
      </Table>
    </div>
  );
};
