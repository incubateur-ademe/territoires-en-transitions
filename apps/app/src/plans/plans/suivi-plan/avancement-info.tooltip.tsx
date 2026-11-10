import { appLabels } from '@/app/labels/catalog';
import { InfoTooltip } from '@tet/ui';

export const AvancementInfoTooltip = ({ intro }: { intro: string }) => (
  <InfoTooltip
    label={
      <div className="flex flex-col gap-4 max-w-sm font-normal">
        <div>
          <p className="mb-0">{intro}</p>
          {appLabels.suiviPlanAvancementInfoRegles.map(({ statut, valeur }) => (
            <p key={statut} className="mb-0">
              <b>{statut}</b>
              {valeur}
            </p>
          ))}
        </div>
        <p className="mb-0">{appLabels.suiviPlanAvancementInfoExclusions}</p>
      </div>
    }
  />
);
