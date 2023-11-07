import {Suspense} from 'react';
import {lazy} from 'utils/lazy';
import {renderLoader} from 'utils/renderLoader';
import {TActionPreuvePanelProps} from './ActionPreuvePanel';

const Panel = lazy(() => import('./ActionPreuvePanel'));

export const ActionPreuvePanel = (props: TActionPreuvePanelProps) => (
  <Suspense fallback={renderLoader()}>
    <Panel {...props} />
  </Suspense>
);
