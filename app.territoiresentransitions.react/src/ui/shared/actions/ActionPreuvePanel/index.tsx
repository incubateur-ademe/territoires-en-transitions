import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';
import {TActionPreuvePanelProps} from './ActionPreuvePanel';

const Panel = lazy(() => import('./ActionPreuvePanel'));

export const ActionPreuvePanel = (props: TActionPreuvePanelProps) => (
  <Suspense fallback={renderLoader()}>
    <Panel {...props} />
  </Suspense>
);
