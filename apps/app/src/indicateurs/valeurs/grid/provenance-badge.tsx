import { Badge } from '@tet/ui';
import { JSX, memo } from 'react';
import { SourceInfo } from './types';

const shortYear = (dateVersion: string): string =>
  `'${dateVersion.slice(2, 4)}`;

export const ProvenanceBadge = memo(
  ({ source }: { source: SourceInfo }): JSX.Element => (
    <Badge
      size="xs"
      title={`${source.libelle} ${shortYear(source.dateVersion)}`}
    />
  )
);

ProvenanceBadge.displayName = 'ProvenanceBadge';
