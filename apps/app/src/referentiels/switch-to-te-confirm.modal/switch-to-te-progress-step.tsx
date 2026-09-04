import { appLabels } from '@/app/labels/catalog';
import { Icon } from '@tet/ui';

export const SwitchToTeProgressStep = () => (
  <div className="flex flex-col items-center text-center gap-2 py-6">
    <Icon
      icon="loader-3-line"
      size="2xl"
      className="animate-spin-slow text-primary-8 mb-2"
    />
    <p className="font-bold mb-0 text-primary-9">
      {appLabels.switchToTeConfirmProgressTitre}
    </p>
    <p className="mb-0 text-grey-8">
      {appLabels.switchToTeConfirmProgressDescription}
    </p>
  </div>
);
