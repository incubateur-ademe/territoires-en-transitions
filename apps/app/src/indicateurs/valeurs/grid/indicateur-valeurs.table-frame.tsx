'use client';

import { appLabels } from '@/app/labels/catalog';
import { cn, Table } from '@tet/ui';
import {
  ComponentProps,
  CSSProperties,
  ReactNode,
  RefObject,
  useId,
  useRef,
} from 'react';
import { IndicateurValeursScrollbar } from './indicateur-valeurs.scrollbar';
import { GridMaxHeight } from './types';
import { useHorizontalScrollEdges } from './use-horizontal-scroll-edges';
import { useTableHeadHeight } from './use-table-head-height';

type Props = {
  children: ReactNode;
  className?: string;
  maxHeight?: GridMaxHeight;
  /** Combined annual values need content-sized columns; PCAET uses fixed widths. */
  layout?: 'fixed' | 'auto';
  'aria-label'?: string;
  'data-test'?: string;
  role?: ComponentProps<typeof Table>['role'];
  scrollRef?: RefObject<HTMLDivElement | null>;
  persistentScrollbar?: boolean;
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
  className,
  maxHeight = 'compact',
  layout = 'fixed',
  'aria-label': ariaLabel = appLabels.indicateurValeursGrille,
  'data-test': dataTest,
  role = 'grid',
  scrollRef: externalScrollRef,
  persistentScrollbar = false,
}: Props) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const headHeight = useTableHeadHeight(tableRef);
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const scrollRef = externalScrollRef ?? internalScrollRef;
  const scrollId = useId();
  const { canScrollLeft, canScrollRight, ...scrollPosition } =
    useHorizontalScrollEdges(scrollRef);

  return (
    <div className="min-w-0">
      <div
        id={scrollId}
        ref={scrollRef}
        data-test={dataTest}
        data-can-scroll-left={canScrollLeft}
        data-can-scroll-right={canScrollRight}
        // The height cap creates the vertical scroll area. Isolation keeps sticky
        // headers below page chrome; scroll edges drive the pinned-column shadows.
        className={cn(
          'group isolate overflow-auto rounded-xl border border-grey-3',
          MAX_HEIGHT_CLASSNAME[maxHeight],
          persistentScrollbar &&
            '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          className
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
      {persistentScrollbar && (
        <IndicateurValeursScrollbar
          {...scrollPosition}
          controls={scrollId}
          onScroll={(left) =>
            scrollRef.current?.scrollTo({ left, behavior: 'instant' })
          }
        />
      )}
    </div>
  );
};
