import { Alert } from '@tet/ui';
import type { ReactNode } from 'react';

export const ModeBannerAlert = ({
  mode,
  title,
  description,
  state,
  children,
}: {
  mode: string;
  title: string;
  description: string;
  state: 'info' | 'warning';
  children?: ReactNode;
}) => (
  <div
    role="status"
    data-test="referentiels.mode-banner"
    data-referentiel-mode={mode}
  >
    <Alert
      className="mb-8"
      title={title}
      description={
        <div className="flex flex-col gap-2 text-sm">
          <p className="mb-0 whitespace-pre-line">{description}</p>
          {children}
        </div>
      }
      state={state}
    />
  </div>
);
