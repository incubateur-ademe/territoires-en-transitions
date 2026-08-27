import { appLabels } from '@/app/labels/catalog';
import { Badge } from '@tet/ui';
import { BulletList } from './bullet-list';

export const SwitchToTeInfoStep = () => (
  <div className="flex flex-col gap-6">
    <p className="mb-0">{appLabels.switchToTeConfirmIntro}</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div className="flex flex-col gap-3">
        <Badge
          variant="success"
          icon="check-line"
          title={appLabels.switchToTeConfirmAutoTitre}
          className="self-start"
        />
        <BulletList content={appLabels.switchToTeConfirmAutoItems} />
      </div>
      <div className="flex flex-col gap-3">
        <Badge
          variant="warning"
          icon="arrow-right-line"
          title={appLabels.switchToTeConfirmManuelTitre}
          className="self-start"
        />
        <BulletList content={appLabels.switchToTeConfirmManuelItems} />
      </div>
    </div>
  </div>
);
