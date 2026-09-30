import { appLabels } from '@/app/labels/catalog';
import type { JSX } from 'react';
import SpinnerLoader from './SpinnerLoader';

const LoadingStatus = (): JSX.Element => (
  <div role="status" className="flex h-96 items-center justify-center">
    <SpinnerLoader className="h-8 w-8" />
    <span className="sr-only">{appLabels.chargementEnCours}</span>
  </div>
);

export { LoadingStatus };
