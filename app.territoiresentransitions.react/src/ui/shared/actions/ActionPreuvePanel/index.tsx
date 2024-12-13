import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';
import { TActionPreuvePanelProps } from './ActionPreuvePanel';

const Panel = lazy(() => import('./ActionPreuvePanel'));

export const ActionPreuvePanel = (props: TActionPreuvePanelProps) => (
  <Suspense fallback={renderLoader()}>
    <Panel {...props} />
  </Suspense>
);
