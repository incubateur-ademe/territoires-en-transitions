import { appLabels } from '@/app/labels/catalog';
import { Alert } from '@tet/ui';

export const SwitchToTeErrorStep = ({
  error,
}: {
  error: { message: string } | null;
}) => (
  <Alert
    state="error"
    title={appLabels.switchToTeConfirmErrorTitre}
    description={error?.message}
  />
);
