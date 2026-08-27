import { appLabels } from '@/app/labels/catalog';
import { Button, Icon } from '@tet/ui';

export const SwitchToTeSuccessStep = ({ onDone }: { onDone: () => void }) => (
  <div className="flex flex-col items-center text-center gap-2 py-6">
    <div className="rounded-lg bg-success-2 p-3 mb-2">
      <Icon icon="check-line" size="xl" className="text-success-1" />
    </div>
    <p className="font-bold mb-0 text-primary-9">
      {appLabels.switchToTeConfirmSuccessTitre}
    </p>
    <p className="mb-4 text-grey-8">
      {appLabels.switchToTeConfirmSuccessDescription}
    </p>
    <Button onClick={onDone}>{appLabels.switchToTeConfirmSuccessCta}</Button>
  </div>
);
