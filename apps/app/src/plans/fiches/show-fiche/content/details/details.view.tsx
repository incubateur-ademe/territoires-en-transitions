import { appLabels } from '@/app/labels/catalog';
import { CardCoverBanner } from '@/app/ui/shared/card-cover.banner';
import { capitalize } from '@tet/ui/labels/plural';
import { Acteurs } from './acteurs';
import { Description } from './description';
import { FormSection } from './form-section';
import { Planning } from './planning';

export const DetailsView = () => {
  return (
    <div className="flex gap-6 sm:flex-row flex-col w-full">
      <div className="w-full md:flex-[2]">
        <CardCoverBanner />
        <FormSection>
          <Description />
        </FormSection>
      </div>
      <div className="flex flex-col gap-4 md:flex-[1]">
        <FormSection title="Calendrier">
          <Planning />
        </FormSection>
        <FormSection title={capitalize(appLabels.acteur({ plural: true }))}>
          <Acteurs />
        </FormSection>
      </div>
    </div>
  );
};
