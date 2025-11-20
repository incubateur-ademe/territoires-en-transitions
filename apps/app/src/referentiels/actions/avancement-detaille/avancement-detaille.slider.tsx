import classNames from 'classnames';
import { pick } from 'es-toolkit';

import { avancementToLabel } from '@/app/app/labels';
import { actionAvancementColors } from '@/app/app/theme';
import { toPercentString } from '@/app/utils/to-percent-string';
import { StatutAvancement } from '@tet/domain/referentiels';
import { Slider } from '@tet/ui';

export type AvancementValues = [number, number, number];

type Props = {
  avancement: AvancementValues;
  onChange: (newValues: AvancementValues) => void;
  className?: string;
};

type Status = Extract<StatutAvancement, 'fait' | 'programme' | 'pas_fait'>;

const status: Record<Status, string> = pick(avancementToLabel, [
  'fait',
  'programme',
  'pas_fait',
]);

/** Slider avec valeurs réutilisable pour gérer les statuts avancés dans le référentiel */
const AvancementDetailleSlider = ({
  avancement,
  onChange,
  className,
}: Props) => {
  const [done, scheduled] = avancement;

  return (
    <div className={classNames('w-full flex flex-col', className)}>
      {/** Slider */}
      <Slider
        step={5}
        max={100}
        value={[
          Math.round(done * 100), // done
          Math.round((done + scheduled) * 100), // not done
        ]}
        onValueChange={(values) => {
          const done = values[0] / 100;
          const scheduled = (values[1] - values[0]) / 100;
          const notDone = (100 - values[1]) / 100;
          onChange([done, scheduled, notDone]);
        }}
        rangeColors={[
          actionAvancementColors.fait,
          actionAvancementColors.programme,
          actionAvancementColors.pas_fait,
        ]}
      />
      {/** Correspondance pourcentage */}
      <div className="flex m-auto mt-6 gap-8">
        {Object.keys(status).map((statut, index) => (
          <div key={statut} className="flex gap-2 items-center">
            <div
              className="h-3 w-4 rounded"
              style={{
                backgroundColor: actionAvancementColors[statut as Status],
              }}
            />
            <span className="font-medium text-sm text-primary-9">
              {status[statut as Status]} {toPercentString(avancement[index])}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvancementDetailleSlider;
