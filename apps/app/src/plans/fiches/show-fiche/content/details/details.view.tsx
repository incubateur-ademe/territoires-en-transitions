import { Acteurs } from './acteurs';
import { Description } from './description';
import { FormSection } from './form-section';
import { Planning } from './planning';

export const DetailsView = () => {
  return (
    <div className="flex gap-6 sm:flex-row flex-col w-full">
      <div className="w-full md:flex-[2]">
        <div className="rounded-b-none rounded-t-lg top-[-100px] h-[69px] w-full bg-primary-9 bg-[url('/fiche-action-header-bg.jpg')] bg-cover bg-center opacity-60" />
        <FormSection>
          <Description />
        </FormSection>
      </div>
      <div className="flex flex-col gap-4 md:flex-[1]">
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
