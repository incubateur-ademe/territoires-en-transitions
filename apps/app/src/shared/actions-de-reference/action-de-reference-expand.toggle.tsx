import { Button } from '@tet/ui';
import { type JSX, useState } from 'react';

export const useExpandable = (): {
  readonly isExpanded: boolean;
  readonly toggle: () => void;
} => {
  const [isExpanded, setIsExpanded] = useState(false);
  return {
    isExpanded,
    toggle: () => setIsExpanded((previous) => !previous),
  };
};

type ActionDeReferenceExpandToggleProps = {
  readonly isExpanded: boolean;
  readonly collapsedLabel: string;
  readonly expandedLabel: string;
  readonly onToggle: () => void;
};

export const ActionDeReferenceExpandToggle = ({
  isExpanded,
  collapsedLabel,
  expandedLabel,
  onToggle,
}: ActionDeReferenceExpandToggleProps): JSX.Element => (
  <Button
    variant="link"
    size="sm"
    icon={isExpanded ? 'arrow-up-s-line' : 'arrow-down-s-line'}
    iconPosition="right"
    aria-expanded={isExpanded}
    onClick={onToggle}
  >
    {isExpanded ? expandedLabel : collapsedLabel}
  </Button>
);
