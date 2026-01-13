import { Acteurs } from './acteurs';
import { Description } from './description';
import { PanelForm } from './panel.form';
import { Planning } from './planning';

export const DetailsView = () => {
  return (
    <div className="flex gap-4 sm:flex-row flex-col">
      <div className="flex gap-4 w-full md:w-2/3 flex-col">
        <PanelForm>
          <Description />
        </PanelForm>
      </div>
      <div className="flex flex-col gap-4 min-w-[472px]">
        <PanelForm title="Calendrier">
          <Planning />
        </PanelForm>
        <PanelForm title="Acteurs du projet">
          <Acteurs />
        </PanelForm>
      </div>
    </div>
  );
};
