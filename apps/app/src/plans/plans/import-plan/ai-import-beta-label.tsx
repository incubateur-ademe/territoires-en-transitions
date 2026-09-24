import { appLabels } from '@/app/labels/catalog';
import { Badge } from '@tet/ui';
import { ReactNode } from 'react';

export const AiImportBetaLabel = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center gap-2">
    {children}
    <Badge title={appLabels.importPlanIaBeta} variant="new" size="sm" />
  </span>
);
