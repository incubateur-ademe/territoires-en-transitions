import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { lazy } from '@/app/utils/lazy';
import { Suspense } from 'react';
import { TActionPreuvePanelProps } from './action-preuve.panel';

const Panel = lazy(() => import('./action-preuve.panel'));

export const ActionPreuvePanel = (props: TActionPreuvePanelProps) => (
  <Suspense
    fallback={
      <div className="flex flex-col p-8">
        <SpinnerLoader className="m-auto" />
      </div>
    }
  >
    <Panel {...props} />
  </Suspense>
);
