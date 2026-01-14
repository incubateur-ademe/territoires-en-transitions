import { Acteurs } from './acteurs';
import { Description } from './description';
import { FormSection } from './form-section';
import { Planning } from './planning';

export const DetailsView = () => {
  return (
    <div className="flex gap-6 sm:flex-row flex-col">
      <div className="w-full md:w-2/3">
        <FormSection>
          <Description />
        </FormSection>
      </div>
      <div className="flex flex-col gap-4 min-w-[472px]">
        <FormSection title="Calendrier">
          <Planning />
        </FormSection>
        <FormSection title="Acteurs du projet">
          <Acteurs />
        </FormSection>
      </div>
    </div>
  );
};
