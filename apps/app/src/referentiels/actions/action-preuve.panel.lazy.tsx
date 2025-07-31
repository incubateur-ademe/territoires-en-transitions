import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';
import { TActionPreuvePanelProps } from './action-preuve.panel';

const Panel = lazy(() => import('./action-preuve.panel'));

export const ActionPreuvePanel = (props: TActionPreuvePanelProps) => (
  <Suspense fallback={renderLoader()}>
    <Panel {...props} />
  </Suspense>
);
