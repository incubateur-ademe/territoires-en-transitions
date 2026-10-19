import { Badge } from '@tet/ui';
import type { JSX } from 'react';

const TooltipHint = ({ hint }: { hint: string }): JSX.Element => (
  <Badge
    title={hint}
    variant="info"
    type="solid"
    size="sm"
    icon="information-fill"
    iconPosition="left"
    uppercase={false}
    trim={false}
    className="w-full max-w-full justify-end"
  />
);

export { TooltipHint };
