import { ReactNode } from 'react';
import { VisibleWhen } from '../../design-system/VisibleWhen';
import { cn } from '../../utils/cn';

export type AppShellProps = {
  header: ReactNode;
  footer: ReactNode;
  pageFrame?: (page: ReactNode) => ReactNode;
  sidePanel?: ReactNode;
  isSidePanelOpen?: boolean;
  belowFooter?: ReactNode;
  children: ReactNode;
};

const renderPageWithoutFrame = (page: ReactNode): ReactNode => page;

export const AppShell = ({
  header,
  footer,
  pageFrame = renderPageWithoutFrame,
  sidePanel,
  isSidePanelOpen = false,
  belowFooter,
  children,
}: AppShellProps) => (
  <div
    className={cn(
      'min-h-screen grid grid-cols-[1fr_0] grid-rows-[auto_1fr] overflow-x-clip transition-all duration-500',
      isSidePanelOpen && 'grid-cols-[0_100vw] lg:grid-cols-side-panel-open'
    )}
  >
    <div
      className={cn('col-start-1 col-span-2 row-start-1', {
        'max-lg:hidden': isSidePanelOpen,
      })}
    >
      {header}
    </div>
    <div
      className={cn('col-start-1 row-start-2 flex flex-col min-w-0', {
        'max-lg:hidden': isSidePanelOpen,
      })}
    >
      {pageFrame(
        <div className="grow flex flex-col w-full max-w-8xl mx-auto px-2 md:px-4 lg:px-6 pb-12 pt-6">
          {children}
        </div>
      )}
      {footer}
      <VisibleWhen condition={!!belowFooter}>
        <div className="p-4">{belowFooter}</div>
      </VisibleWhen>
    </div>
    <div className="col-start-2 row-start-1 row-span-2">{sidePanel}</div>
  </div>
);
