import { appLabels } from '@/app/labels/catalog';
import { Button } from '@tet/ui';
import { JSX } from 'react';

export const FicheCardLinkAction = ({
  isLinked,
  onToggle,
}: {
  isLinked: boolean;
  onToggle: () => void;
}): JSX.Element => (
  <Button
    icon={isLinked ? 'link-unlink' : 'link'}
    title={isLinked ? appLabels.dissocierAction : appLabels.lierLAction}
    variant="grey"
    size="xs"
    onClick={onToggle}
  />
);
